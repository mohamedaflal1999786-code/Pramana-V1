import { updateAdminPassword } from "./set-admin-password";
updateAdminPassword().catch(()=>{console.error("Administrator password rotation failed.");process.exitCode=1;});
