import Link from "next/link";
import {WorkspaceLayout} from "@/components/workspace/WorkspaceLayout";
import {getPatientSafetyAlertsAction} from "@/lib/actions/ai-actions";
export default async function PharmacistPage(){
  const queue=await getPatientSafetyAlertsAction();
  return <WorkspaceLayout activeRole="pharmacist"><h1>Clinical pharmacy</h1><Link className="tile block underline" href="/workspaces/medications">Open patient medication and allergy records</Link>
    <section className="tile"><h2>Recent alerts for assigned patients</h2>{!queue.length && <p>No recorded alerts.</p>}{queue.map(alert=><p key={alert.id}>{alert.title} · {alert.reviewStatus}</p>)}
    <Link className="underline" href="/workspaces/review">Review clinical findings</Link></section></WorkspaceLayout>;
}
