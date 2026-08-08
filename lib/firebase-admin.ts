import { initializeApp, cert, getApps } from "firebase-admin/app";

if (getApps().length === 0) {
  initializeApp({
    projectId: "mypeer-501909",
  });
}
