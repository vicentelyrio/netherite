export {}
/* import { useCallback, useState } from 'react' */
/* import { unified, type VFileWithOutput } from 'unified' */
/* import remarkParse from 'remark-parse' */
/* import remarkStringify from 'remark-stringify' */
/* import remarkFrontmatter from 'remark-frontmatter' */
/* import remarkParseFrontmatter from 'remark-parse-frontmatter' */
/* import remarkRehype from 'remark-rehype' */
/* import rehypeStringify from 'rehype-stringify' */
/**/
/* export const usePage = (): any => { */
/*   const [parsing, setParsing] = useState(false) */
/*   const [file, setFile] = useState<VFileWithOutput<any> | null>(null) */
/**/
/*   const getPage = useCallback(async (contents: string) => { */
/*     setParsing(true) */
/**/
/*     const file = await unified() */
/*       .use(remarkParse) */
/*       .use(remarkStringify) */
/*       .use(remarkFrontmatter, ['yaml', 'toml']) */
/*       .use(remarkParseFrontmatter) */
/*       .use(remarkRehype) */
/*       .use(rehypeStringify) */
/*       .process(contents) */
/**/
/*     setFile(file) */
/*     setParsing(false) */
/*   }, []) */
/**/
/*   return { */
/*     getPage, */
/*     parsing, */
/*     file, */
/*   } */
/* } */
