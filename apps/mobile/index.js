import "./src/session-bootstrap";
import { registerRootComponent } from "expo";
import AppSafe from "./src/AppSafe";
import SupplierUniverseGate from "./src/SupplierUniverseGate";

function Root() {
  return <SupplierUniverseGate><AppSafe /></SupplierUniverseGate>;
}

registerRootComponent(Root);
