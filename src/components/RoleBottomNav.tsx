import { BottomNav } from "./BottomNav";
import { DoctorBottomNav } from "./DoctorBottomNav";

export function RoleBottomNav() {
  const userType = localStorage.getItem("userType");
  return userType === "doctor" ? <DoctorBottomNav /> : <BottomNav />;
}
