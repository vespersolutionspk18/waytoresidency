import { AttemptRuntime } from '@/components/runtime/AttemptRuntime';

export default async function TutorRuntimePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AttemptRuntime attemptId={id} />;
}
