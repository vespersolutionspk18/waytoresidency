import { AttemptRuntime } from '@/components/runtime/AttemptRuntime';

export default async function QuizRuntimePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AttemptRuntime attemptId={id} />;
}
