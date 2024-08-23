# tailwind-base
Let you exploit Tailwind in React more powerful

## Getting Started
### Installation
1. `yarn add @daldalso/tailwind-base`
2. `npx tailwind-base globals.css` (You should replace `globals.css` with the path of a proper Tailwind CSS file which contains something like `@tailwind base;`.)
3. In the end of your root component file, call `loadTailwindBase` with the tailwind-base config object generated by the previous command.

After the installation, you can call the default function `c` from `@daldalso/tailwind-base` to merge Tailwind classes like below:
```jsx
import { useState } from "react";
import c from "@daldalso/tailwind-base";

const MyComponent = () => {
  const [ blue, setBlue ] = useState(true);

  // The className goes to `text-center text-blue`.
  return <div className={c("text-center text-red", blue && "text-blue")}>
    Hello, <span className={c("font-bold")}>World</span>!
  </div>;
};
export default MyComponent;
```

### Implicit Mergence
In TypeScript, you can also merge the classes without explicitly calling `c`.
All you have to do is setting `jsxImportSource` in your `tsconfig.json` to `@daldalso/tailwind-base`.

After that, you can rewrite the above code like this:
```tsx
import { useState } from "react";

const MyComponent = () => {
  const [ blue, setBlue ] = useState(true);

  // The className goes to `text-center text-blue`.
  return <div c={["text-center text-red", blue && "text-blue"]}>
    Hello, <span c="font-bold">World</span>!
  </div>;
};
export default MyComponent;
```

## Caveat
- You have to run `npx tailwind-base globals.css` whenever you update your Tailwind config file to let tailwind-base merge the updated classes correctly.