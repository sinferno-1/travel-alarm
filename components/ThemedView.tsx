import { useColorScheme, View, ViewProps } from "react-native";

export function ThemedView(props: ViewProps) {
  const theme = useColorScheme();

  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: theme === "dark" ? "#000" : "#fff",
        },
        props.style,
      ]}
    />
  );
}
