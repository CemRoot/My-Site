import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const hookPath = resolve(__dirname, '../src/lib/hooks/useTechNews.ts');

test('useTechNews restoration effect uses state loading flags', () => {
  const source = readFileSync(hookPath, 'utf8');
  const sourceFile = ts.createSourceFile(
    hookPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  let restorationEffectCallback = null;

  const findRestorationEffect = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'useEffect') {
      const callback = node.arguments[0];
      if (
        callback &&
        (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) &&
        callback.getText(sourceFile).includes('restorationTargetPage')
      ) {
        restorationEffectCallback = callback;
      }
    }
    ts.forEachChild(node, findRestorationEffect);
  };

  findRestorationEffect(sourceFile);
  assert.ok(restorationEffectCallback, 'Expected to find restoration useEffect callback');

  const disallowedIdentifiers = [];
  const names = new Set(['loading', 'loadingMore']);
  const visitEffectCallback = (node) => {
    if (ts.isIdentifier(node) && names.has(node.text)) {
      const parent = node.parent;
      const isStatePropertyAccess =
        ts.isPropertyAccessExpression(parent) &&
        parent.name === node &&
        ts.isIdentifier(parent.expression) &&
        parent.expression.text === 'state';

      if (!isStatePropertyAccess) {
        disallowedIdentifiers.push(node.text);
      }
    }
    ts.forEachChild(node, visitEffectCallback);
  };

  visitEffectCallback(restorationEffectCallback);

  assert.deepStrictEqual(disallowedIdentifiers, []);
});
