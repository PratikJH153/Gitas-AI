import {GoogleGenerativeAI} from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({model: "gemini-2.0-flash-exp"});

export const aiSummarizeCommit = async (diff: string) => {
    const result = await model.generateContent([
        `You are an expert programmer and software architect with in-depth knowledge of codebases, Git, software design principles, security, optimization, and common vulnerabilities. Your task is to analyze and summarize Git diffs.

Always keep the following goals in mind:
- Summarize what has changed at a high level.
- Highlight refactorings, bug fixes, or new features.
- Call out potential performance or security risks.
- Be aware of vulnerable patterns being added or removed.
- Point out edge cases or potentially risky logic changes.` + 

        `\n\nUnderstanding Git Diff Format:
In a Git diff:
- Lines starting with \`-\` represent code that was **removed**.
- Lines starting with \`+\` represent code that was **added**.
- Unchanged lines are shown without a prefix and provide context.` +

        `\n\nExample of a Git Diff:
\`\`\`diff
diff --git a/utils.js b/utils.js
index 1a2b3c4..5d6e7f8 100644
--- a/utils.js
+++ b/utils.js
@@ -1,8 +1,4 @@
 function calculateTotal(items) {
-    let total = 0;
-    for (let i = 0; i < items.length; i++) {
-        total += items[i].price;
-    }
-    return total;
+    return items.reduce((sum, item) => sum + item.price, 0);
 }
+ \`\`\`
How You Should Analyze:
Summarize like this:
- Replaced for-loop accumulation with Array.prototype.reduce, improving code readability and potential performance.
- Functional programming style improves maintainability.
- Behavior should remain consistent assuming all items have a numeric price field.

Edge Cases to Watch For:
- Sensitive logic like authentication, authorization, encryption, or monetary calculations: check for accuracy and regressions.
- Hardcoded secrets or tokens added in diffs.
- Deleted validations, checks, or logs that may reduce visibility or error handling.
- Logic changes that may affect loop behavior, async timing, or ordering.
- Additions relying on external or user input: watch for injection, validation, or trust issues.
- If \`+\` or \`-\` lines affect shared utilities or base classes, consider global impact.
- Large blocks of added or removed code: confirm intention and completeness.

Final Task:
When given a git diff, return a concise and professional summary like this:
"Summary: Refactored \`calculateTotal\` by replacing a for-loop with a reduce function, improving code readability and maintainability. No changes to core logic or output. Ensure all inputs are validated for numeric consistency."

Now begin.
`,
        `Please summarize the following git diff: \n\n${diff}`
    ]);
    return result.response.text();
}
