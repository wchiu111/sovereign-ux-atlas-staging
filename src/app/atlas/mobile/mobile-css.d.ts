import "react";

declare module "react" {
  interface CSSProperties {
    WebkitUserDrag?: "auto" | "none" | "element";
  }
}
