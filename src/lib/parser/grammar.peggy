start = arr:(header / code / content / newline)+ {
   return arr.flat();
}

newline = "\n" {
    return { type: 'text', content: '\n', loc: location() };
}

code = "```" name:$[^\n]* code:$(!"\n```" .)* "\n```" {
    return { type: 'code', content: code, language: name, loc: location() };
}

header = level:$'#'+ __ text:$[^\n]+ {
    const content = `${level} ${text}`;
    return { type: 'header', content, level: level.length, loc: location() };
}

list_item = '*' __ text:$[^\n]+ {
    return { type: 'list', content: '* ' + text, loc: location() };
}

inline_text = bold / italic / inline_link / list_item / [^\n]

content = arr:inline_text+ {
    return arr.reduce((acc, item) => {
       if (typeof item === 'string') {
          if (acc.length) {
              const last = acc[acc.length - 1];
              if (last.type === 'text') {
                  last.content += item;
                  return acc;
              }
          }
          acc.push({ type: 'text', content: item });
          return acc;
       } else {
          acc.push(item);
          return acc;
       }
    }, []);
}

inline_link = '[' text:$[^\]]* ']' '(' url:$[^)]+ ')' {
    return {
        type: 'link',
        text: text,
        url: url,
        content: `[${text}](${url})`
   , loc: location() };
}

bold = bold_a / bold_b

bold_a = '__' text:(text_bold_a / italic) '__' {
    return { type: 'bold', content: `__${text}__`, loc: location() };
}
text_bold_a = text:$[^_]+ {
    return text;
}

bold_b = '**' text:(text_bold_b / italic) '**' {
    return { type: 'bold', content: `**${text}**`, loc: location() };
}

text_bold_b = text:$[^*]+ {
    return text;
}

italic = italic_a / italic_b

italic_a = '*' !' ' text:$[^*]+ !' ' '*' {
    return { type: 'italic', content: `*${text}*`, loc: location() };
}

italic_b = '_' text:$[^_]+ '_' {
    return { type: 'italic', content: `_${text}_`, loc: location() };
}

nl = "\n"
_ "whitespace" = [ \t]*
__ "whitespace" = [ \t]
