import type {Meta, StoryObj} from '@storybook/nextjs-vite'
import {useTranslations} from 'next-intl'

import {
  DocPage,
  DocSection,
  Figure,
  FlowMap,
  LegendItem,
  NoteList,
  SequenceDiagram,
  SourceNote,
  useFlowText,
  type FlowEdge,
  type FlowNode,
  type Lane,
  type Step,
} from './flow-doc'

/*
 * The Q&A flow, both halves: how an admin turns sources into a published
 * dataset, and how a learner takes it.
 *
 * A flow map for the whole journey, then a sequence diagram per half. The map's
 * boxes carry no `href` — unlike `Chat.stories.tsx` there is no screen story to
 * link them to. The two halves meet at one place, the published final set: the
 * learner never sees sets, outlines or generations (`docs/qa-learner.md`).
 */

const meta: Meta = {
  title: 'Flows/QA',
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj

/**
 * The Q&A page. A story rather than MDX so the locale toolbar reaches the prose —
 * see `flow-doc.tsx`.
 */
export const Overview: Story = {
  parameters: {layout: 'fullscreen'},
  render: function QAOverviewPage() {
    const t = useTranslations('sb.flows.qa')
    const tc = useTranslations('sb.flows.common')
    const l = useFlowText('sb.flows.qa.authorLanes')
    const s = useFlowText('sb.flows.qa.authorSteps')
    const ll = useFlowText('sb.flows.qa.learnLanes')
    const ls = useFlowText('sb.flows.qa.learnSteps')
    const n = useFlowText('sb.flows.qa.nodes')
    const e = useFlowText('sb.flows.qa.edges')
    const authorNotes = useTranslations('sb.flows.qa.authorNotes')
    const learnNotes = useTranslations('sb.flows.qa.learnNotes')

    const nodes: FlowNode[] = [
      {x: 20, y: 40, label: n('source'), note: n('sourceNote'), primary: true},
      {x: 250, y: 40, label: n('outline'), note: n('outlineNote')},
      {x: 480, y: 40, label: n('generate'), note: n('generateNote')},
      {x: 710, y: 40, label: n('review'), note: n('reviewNote')},
      {x: 940, y: 40, label: n('final'), note: n('finalNote')},
      {
        x: 940,
        y: 150,
        label: n('published'),
        note: n('publishedNote'),
        end: true,
      },
      {x: 20, y: 290, label: n('browse'), note: n('browseNote')},
      {x: 250, y: 290, label: n('start'), note: n('startNote')},
      {x: 480, y: 290, label: n('answer'), note: n('answerNote')},
      {x: 710, y: 290, label: n('finish'), note: n('finishNote')},
      {x: 940, y: 290, label: n('feedback'), note: n('feedbackNote')},
      {x: 940, y: 400, label: n('queue'), note: n('queueNote'), end: true},
    ]

    const edges: FlowEdge[] = [
      {d: 'M210 66 H242'},
      {d: 'M440 66 H472'},
      {d: 'M670 66 H702'},
      {d: 'M900 66 H932'},
      {d: 'M1035 92 V142'},
      {
        d: 'M1035 202 V246 H115 V282',
        label: e('onlyPublished'),
        labelX: 580,
        labelY: 238,
        anchor: 'middle',
      },
      {d: 'M210 316 H242'},
      {d: 'M440 316 H472'},
      {d: 'M670 316 H702'},
      {d: 'M900 316 H932'},
      {d: 'M1035 342 V392', label: e('toQueue'), labelX: 1045, labelY: 372},
    ]

    const authorLanes: Lane[] = [
      {x: 130, label: l('ui'), note: l('uiNote')},
      {x: 360, label: l('be'), note: l('beNote')},
      {x: 590, label: l('run'), note: l('runNote')},
      {x: 820, label: l('db'), note: l('dbNote')},
    ]

    const authorSteps: Step[] = [
      {from: 0, to: 1, label: s('1')},
      {from: 0, to: 1, label: s('2')},
      {from: 1, to: 0, label: s('3'), back: true},
      {from: 0, to: 1, label: s('4'), accent: true},
      {from: 1, to: 2, label: s('5')},
      {from: 2, to: 1, label: s('6'), back: true},
      {from: 0, to: 1, label: s('7')},
      {from: 0, to: 1, label: s('8'), accent: true},
      {from: 1, to: 3, label: s('9')},
    ]

    const learnLanes: Lane[] = [
      {x: 130, label: ll('ui'), note: ll('uiNote')},
      {x: 360, label: ll('be'), note: ll('beNote')},
      {x: 590, label: ll('attempt'), note: ll('attemptNote')},
      {x: 820, label: ll('admin'), note: ll('adminNote')},
    ]

    const learnSteps: Step[] = [
      {from: 0, to: 1, label: ls('1')},
      {from: 1, to: 0, label: ls('2'), back: true},
      {from: 0, to: 1, label: ls('3'), accent: true},
      {from: 1, to: 2, label: ls('4')},
      {from: 1, to: 0, label: ls('5'), back: true},
      {from: 0, to: 1, label: ls('6')},
      {from: 1, to: 0, label: ls('7'), back: true},
      {from: 0, to: 1, label: ls('8')},
      {from: 1, to: 0, label: ls('9'), back: true},
      {from: 0, to: 1, label: ls('10')},
      {from: 0, to: 1, label: ls('11')},
      {from: 0, to: 1, label: ls('12'), accent: true},
      {from: 1, to: 3, label: ls('13'), back: true},
    ]

    const legend = (
      <>
        <LegendItem kind="request" label={tc('legendRequest')} />
        <LegendItem kind="push" label={tc('legendPush')} />
        <LegendItem kind="accent" label={tc('legendAccent')} />
      </>
    )

    return (
      <DocPage title={t('title')} lead={t('lead')}>
        <DocSection step={1} title={tc('flowSection')}>
          <Figure
            caption={t('flowCaption')}
            title={tc('flowSection')}
            width={1200}>
            <FlowMap
              viewBox="0 0 1200 470"
              title={t('title')}
              nodes={nodes}
              edges={edges}
            />
          </Figure>
        </DocSection>

        <DocSection step={2} title={t('authorSection')}>
          <Figure
            caption={t('authorCaption')}
            title={t('authorSection')}
            width={990}
            legend={legend}>
            <SequenceDiagram
              title={t('authorSection')}
              lanes={authorLanes}
              steps={authorSteps}
              divider={245}
              frontendLabel={tc('frontend')}
              backendLabel={tc('backend')}
              width={990}
            />
          </Figure>
          <NoteList
            notes={['1', '2', '3', '4'].map((key) => authorNotes(key))}
          />
        </DocSection>

        <DocSection step={3} title={t('learnSection')}>
          <Figure
            caption={t('learnCaption')}
            title={t('learnSection')}
            width={990}
            legend={legend}>
            <SequenceDiagram
              title={t('learnSection')}
              lanes={learnLanes}
              steps={learnSteps}
              divider={245}
              frontendLabel={tc('frontend')}
              backendLabel={tc('backend')}
              width={990}
            />
          </Figure>
          <NoteList
            notes={['1', '2', '3', '4'].map((key) => learnNotes(key))}
          />
        </DocSection>

        <SourceNote textKey="qaSource" />
      </DocPage>
    )
  },
}
