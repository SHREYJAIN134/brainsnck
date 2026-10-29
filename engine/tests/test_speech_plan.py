"""Tests for the speech planner, validator and renderer.  Run:  cd engine && python3 -m unittest -v"""
import os, sys, unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import speech_plan as sp  # noqa: E402

SAY = "Your brain is only about 2% of your body weight. But it burns around — *20%* of your energy!"
CLAIM = "I never said he stole the money."


def llm_plan(**over):
    """A plan of the kind Claude writes: contrastive stress on 'he' (answering 'Did you say HE did it?')."""
    p = {'intent': 'deny that the speaker accused this particular person', 'emotion': 'serious',
         'delivery': {'pace': 1.0, 'energy': 'moderate', 'pitch_style': 'natural', 'overall_style': 'conversational'},
         'segments': [{'text': 'I never said', 'emphasis': 0, 'reason': 'given'},
                      {'text': 'he', 'emphasis': 3, 'reason': 'contrast: someone else did'},
                      {'text': 'stole the money.', 'emphasis': 0, 'reason': 'given information'}],
         'pauses': []}
    p.update(over)
    return p


class Heuristic(unittest.TestCase):
    def test_marked_word_moderate_or_strong(self):
        segs = sp.heuristic_plan(SAY)['segments']
        em = {s['text']: s['emphasis'] for s in segs}
        self.assertEqual(em['20%'], 3, 'payoff after a dash in an exclamation is strong')
        self.assertEqual(sp.heuristic_plan('It sounds *fake*.')['segments'][-1]['emphasis'], 2)

    def test_restrained_without_marks(self):
        plan = sp.heuristic_plan('The sky looks blue because air scatters blue light the most.')
        self.assertTrue(all(s['emphasis'] == 0 for s in plan['segments']))
        self.assertEqual(plan['pauses'], [])

    def test_pauses_from_marks(self):
        pauses = sp.heuristic_plan('Okay... here it is — *the answer*!')['pauses']
        self.assertEqual([p['duration_ms'] for p in pauses], [420, 200])


class Validation(unittest.TestCase):
    def test_good_plan(self):
        plan, warn = sp.validate_plan(llm_plan(), CLAIM)
        self.assertEqual([s['emphasis'] for s in plan['segments']], [0, 3, 0])
        self.assertEqual(warn, [])

    def test_text_must_be_preserved(self):
        for segs in ([{'text': 'I never said he stole money.', 'emphasis': 0}],            # dropped word
                     [{'text': 'I never said he stole the money today.', 'emphasis': 0}],  # added word
                     [{'text': 'he stole the money.', 'emphasis': 0}, {'text': 'I never said', 'emphasis': 0}]):
            with self.assertRaises(sp.PlanError):
                sp.validate_plan(llm_plan(segments=segs), CLAIM)

    def test_bad_structure(self):
        with self.assertRaises(sp.PlanError):
            sp.validate_plan('not json', CLAIM)
        with self.assertRaises(sp.PlanError):
            sp.validate_plan(llm_plan(segments=[]), CLAIM)
        bad = llm_plan(); bad['segments'][1]['emphasis'] = 5
        with self.assertRaises(sp.PlanError):
            sp.validate_plan(bad, CLAIM)

    def test_unsupported_controls_are_reported(self):
        p = llm_plan(emotion='ecstatic', delivery={'pace': 2.0, 'pitch_style': 'rising'})
        p['segments'][1]['pitch'] = 'high'
        plan, warn = sp.validate_plan(p, CLAIM)
        text = ' | '.join(warn)
        self.assertEqual(plan['emotion'], 'neutral')
        self.assertEqual(plan['delivery']['pace'], 1.25)
        self.assertIn('pitch is not controllable', text)
        self.assertIn("pitch 'high' not controllable", text)
        self.assertIn('clamped', text)

    def test_piper_cannot_stress_words(self):
        plan, warn = sp.validate_plan(llm_plan(), CLAIM, engine='piper')
        self.assertTrue(any('cannot mark word stress' in w for w in warn))
        self.assertTrue(all(op['stress'] == [] for op in sp.plan_to_ops(plan, 'piper')))

    def test_pause_must_sit_on_a_boundary(self):
        _, warn = sp.validate_plan(llm_plan(pauses=[{'after_text': 'never', 'duration_ms': 300}]), CLAIM)
        self.assertTrue(any('not at a segment boundary' in w for w in warn))

    def test_over_emphasis_warning(self):
        segs = [{'text': w, 'emphasis': 2} for w in CLAIM.split()]
        _, warn = sp.validate_plan(llm_plan(segments=segs), CLAIM)
        self.assertTrue(any('over-emphasis' in w for w in warn))


class Rendering(unittest.TestCase):
    def ops(self, say, plan=None, engine='kokoro'):
        p, _ = sp.validate_plan(plan or sp.heuristic_plan(say), say, engine)
        return sp.plan_to_ops(p, engine)

    def test_words_preserved_in_order(self):
        for say in (SAY, CLAIM, 'Okay... three facts. Wait, what? It weighs about — *a billion tons*!'):
            spoken = [w['w'] for op in self.ops(say) for w in op['words']]
            self.assertEqual(spoken, [w for w in sp.words(say) if w not in ('—',)])

    def test_strong_emphasis_is_its_own_slower_louder_chunk(self):
        ops = self.ops(CLAIM, llm_plan())
        strong = [op for op in ops if op['gain_db'] > 0]
        self.assertEqual(len(strong), 1)
        self.assertEqual(strong[0]['words'][0]['w'], 'he')
        before = ops[ops.index(strong[0]) - 1]
        self.assertGreaterEqual(before['pause_after'], sp.BEAT_BEFORE_STRONG)
        self.assertTrue(before['tts_text'].endswith(','), 'mid-sentence chunk keeps suspended intonation')
        self.assertLess(strong[0]['speed'], before['speed'])
        self.assertEqual(strong[0]['stress'], [0])

    def test_planned_pause_applied_with_emotion_scale(self):
        plan = llm_plan(emotion='empathetic', pauses=[{'after_text': 'I never said', 'duration_ms': 300}])
        ops = self.ops(CLAIM, plan)
        self.assertAlmostEqual(ops[0]['pause_after'], .3 * sp.EMOTIONS['empathetic'][1], places=3)

    def test_planner_off_is_neutral(self):
        p, _ = sp.validate_plan(sp.neutral_plan(SAY), SAY)
        ops = sp.plan_to_ops(p)
        self.assertTrue(all(op['gain_db'] == 0 and op['stress'] == [] for op in ops))
        self.assertTrue(all(not w['em'] for op in ops for w in op['words']))


class Stress(unittest.TestCase):
    def test_add_stress(self):
        self.assertEqual(sp.add_stress('hiː'), 'hˈiː')
        self.assertEqual(sp.add_stress('nˈɛvɚ'), 'nˈɛvɚ')
        self.assertEqual(sp.add_stress('ðə'), 'ðˈə')

    def test_misaligned_words_left_alone(self):
        ph = 'twˈɛnti pɚsˈɛnt'  # "20%" -> two phoneme words for one text word
        self.assertEqual(sp.stressed_phonemes(ph, 1, [0]), (ph, False))
        self.assertEqual(sp.stressed_phonemes('aɪ hiː', 2, [1]), ('aɪ hˈiː', True))


if __name__ == '__main__':
    unittest.main()
