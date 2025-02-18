import { RLSTest } from "@/components/rls-test"
import { AppLayout } from "@/components/layouts/app-layout"

export default function TestRLSPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <RLSTest />
      </div>
    </AppLayout>
  )
}
