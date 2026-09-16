import "./src/session-bootstrap";
import { registerRootComponent } from "expo";
import App from "./src/App";
import SupplierUniverseGate from "./src/SupplierUniverseGate";

function Root() {
  return <SupplierUniverseGate><App /></SupplierUniverseGate>;
}

registerRootComponent(Root);
