import { cn } from '@/lib/utils';
import type { AttemptQuestion } from '@/lib/api';

type Props = {
  number: number;
  active: boolean;
  question: AttemptQuestion;
  isTutor: boolean;
  /** during a quiz run, hide correctness; reveal post-completion */
  revealCorrectness: boolean;
  onClick?: () => void;
};

export function QuestionTile({
  number,
  active,
  question,
  isTutor,
  revealCorrectness,
  onClick,
}: Props) {
  const answered = !!question.answeredAt;
  const skipped = answered && question.selectedChoiceId === null;
  const reveal = (isTutor && answered) || revealCorrectness;
  const correct = reveal && answered && !skipped && question.isCorrect === true;
  const wrong = reveal && answered && !skipped && question.isCorrect === false;
  const answeredOnly = answered && !skipped && !reveal;

  const unseen = !answered;

  let cls = 'bg-paper-2 text-mute border border-rule italic';
  if (correct) cls = 'bg-correct text-paper border border-correct';
  else if (wrong) cls = 'bg-wrong text-paper border border-wrong';
  else if (skipped) cls = 'bg-paper text-mute border-2 border-dashed border-mute';
  else if (answeredOnly) cls = 'bg-ink text-paper border border-ink';

  const ariaState = correct
    ? ', correct'
    : wrong
      ? ', wrong'
      : skipped
        ? ', skipped'
        : unseen
          ? ', not reached'
          : '';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'relative h-10 rounded-md text-[13px] font-semibold tracking-tight inline-flex items-center justify-center',
        'transition-all duration-150 focus-ring',
        onClick && 'hover:scale-[1.04] hover:border-ink cursor-pointer',
        cls,
        active && 'ring-2 ring-apothecary ring-offset-2 ring-offset-surface',
      )}
      aria-label={`Question ${number}${question.flagged ? ', flagged' : ''}${ariaState}`}
    >
      {number}
      {question.flagged && (
        <span
          aria-hidden
          className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-r-0 border-l-[10px] border-l-transparent border-t-copper"
        />
      )}
    </button>
  );
}

export function TileLegend({
  isTutor,
  revealCorrectness,
}: {
  isTutor: boolean;
  revealCorrectness: boolean;
}) {
  const showCorrectness = isTutor || revealCorrectness;
  return (
    <ul className="space-y-1.5 text-[11.5px] text-mute">
      {showCorrectness ? (
        <>
          <li className="flex items-center gap-2.5">
            <Swatch className="bg-correct border border-correct" /> Correct
          </li>
          <li className="flex items-center gap-2.5">
            <Swatch className="bg-wrong border border-wrong" /> Wrong
          </li>
        </>
      ) : (
        <li className="flex items-center gap-2.5">
          <Swatch className="bg-ink border border-ink" /> Answered
        </li>
      )}
      <li className="flex items-center gap-2.5">
        <Swatch className="bg-paper border-2 border-dashed border-mute" /> Skipped
      </li>
      <li className="flex items-center gap-2.5">
        <Swatch className="bg-paper-2 border border-rule italic" /> Not reached
      </li>
      <li className="flex items-center gap-2.5">
        <span className="relative inline-block w-4 h-4 bg-paper border border-rule rounded-[2px]">
          <span
            aria-hidden
            className="absolute top-0 right-0 w-0 h-0 border-t-[6px] border-l-[6px] border-l-transparent border-t-copper"
          />
        </span>
        Flagged
      </li>
    </ul>
  );
}

function Swatch({ className }: { className?: string }) {
  return <span className={cn('inline-block w-4 h-4 rounded-[3px]', className)} />;
}
