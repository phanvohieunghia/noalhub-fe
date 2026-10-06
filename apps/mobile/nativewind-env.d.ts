/// <reference path="./node_modules/react-native-css-interop/types.d.ts" />
import "react-native";

declare module "react-native" {
  interface TextInputProps {
    className?: string;
  }
}
