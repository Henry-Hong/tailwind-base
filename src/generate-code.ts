import setupContextUtils from "tailwindcss/lib/lib/setupContextUtils.js";
import resolveConfig from "tailwindcss/lib/public/resolve-config.js";
import type { Config } from "tailwindcss";

export default function generateCode(packageName:string, config:Config):string{
  const tailwindConfig = resolveConfig.default(config);
  const tailwindContext = setupContextUtils.createContext(tailwindConfig);
  const classGroupMap:Record<string, Array<string|{ raw: string }>> = {};
  const codedClassGroups:string[] = [];

  // 1. Construct classGroupMap
  for(const [ k, v ] of tailwindContext.candidateRuleMap.entries()){
    if(k.toString() === "*") continue;
    for(let j = 0; j < v.length; j++){
      let groupName = v.length > 1 ? `${k}[${j}]` : k;
      const list:(typeof classGroupMap)[string] = [];
      const [ metadata, rule ] = v[j];

      if('type' in rule && rule.type === "atrule") continue;
      if(metadata.options.types){
        for(const x of metadata.options.types){
          list.push({ raw: `{"${k}":d('${x.type}')}` });
        }
      }
      if(metadata.options.values){
        for(const m in metadata.options.values){
          if(m === "DEFAULT"){
            list.push(k);
            continue;
          }
          list.push(`${k}-${m}`);
          if(metadata.options.supportsNegativeValues){
            list.push(`-${k}-${m}`);
          }
        }
      }else if('type' in rule){
        const props = rule.nodes.filter(x => x.type === "decl").map(x => x.prop);

        groupName = `{${props.sort((a, b) => a.localeCompare(b)).join(',')}}`;
        list.push(k);
      }
      classGroupMap[groupName] = Array.from(new Set(list.concat(classGroupMap[groupName] || [])));
    }
  }

  // 2. Reduce classGroupMap size
  const keyGroups = [
    "size",
    "inset",
    "translate",
    "spacing",
    "colors",
    "opacity",
    "borderRadius",
    "borderWidth",
    "gridRow",
    "gridRowStart"
  ].reduce((pv, v) => {
    pv[v] = Object.keys(tailwindConfig.theme![v]);
    return pv;
  }, {} as Record<string, string[]>);

  for(const [ k, v ] of Object.entries(classGroupMap)){
    if(!v.length) continue;
    const className = k.replace(/\[\d+]$/, "");
    let R = "[";
    let actualV = [ ...v ];
    let hasNegativePair = false;

    for(const [ l, w ] of Object.entries(keyGroups)){
      const indices = w.map(x => [
        actualV.indexOf(x === "DEFAULT" ? className : `${className}-${x}`),
        actualV.indexOf(x === "DEFAULT" ? `-${className}` : `-${className}-${x}`)
      ]);
      if(indices.some(m => m[0] === -1)) continue;
      for(const [ positive, negative ] of indices){
        actualV[positive] = null!;
        if(negative !== -1){
          hasNegativePair = true;
          actualV[negative] = null!;
        }
      }
      actualV = actualV.filter(x => x);
      if(hasNegativePair){
        actualV.push({ raw: `{"${className}":k.${l},"-${className}":k.${l}}` });
      }else{
        actualV.push({ raw: `{"${className}":k.${l}}` });
      }
    }
    for(const w of actualV){
      switch(typeof w){
        case "string": R += `"${w}"`; break;
        case "object": R += w.raw; break;
      }
      R += ",";
    }
    R = R.slice(0, -1) + "]";
    codedClassGroups.push(R);
  }

  // 3. Output
  return [
    `// Auto-generated by ${packageName}`,
    "/* eslint-disable */",
    'const pluginUtils = require("tailwindcss/lib/util/pluginUtils.js");',
    'import { loadTailwindBase } from "@devheerim/tailwind-base";',
    '// See: https://github.com/JJoriping/tailwind-base/pull/4',
    'import React from "react";',
    'import ClientTailwindBaseInitializer from "./client";',
    'import tailwindBaseConfigOverride from "./config";',
    "",
    "const d = (type:string)=>[(value:string)=>Boolean(pluginUtils.typeMap[type](value))];",
    `const k = ${JSON.stringify(keyGroups)};`,
    "",
    "export const tailwindBaseConfig = {",
    "  cacheSize: 0,",
    "  classGroups: [",
    codedClassGroups.join(',\n'),
    "  ],",
    "  conflictingClassGroups: {},",
    "  conflictingClassGroupModifiers: {},",
    `  separator: ${JSON.stringify(tailwindConfig.separator || "-")},`,
    "  ...tailwindBaseConfigOverride",
    '} as import("@devheerim/tailwind-base/lib").TailwindBaseConfig;',
    "loadTailwindBase(tailwindBaseConfig);",
    "export default function TailwindBaseInitializer(){ return <ClientTailwindBaseInitializer />; }"
  ].join('\n');
}