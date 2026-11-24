// Portal de parceiros e embaixadoras da Domus (parceiros.domusbi.app.br).
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import PartnerPortalShell from "@/pages/PartnerPortalShell";

export default function App() {
  return (
    <BrowserRouter>
      <PartnerPortalShell />
      <Toaster />
    </BrowserRouter>
  );
}
