const test = require('node:test');
const assert = require('node:assert/strict');
const guard = require('../middleware/retired-data-sales');
function run(body) {
  let next = false, code, value;
  guard({body}, {status(n){code=n;return this;},json(data){value=data;}},()=>{next=true;});
  return {next,code,value};
}
test('blocks legacy direct data checkout before payment work',()=>{const r=run({tier:'data'});assert.equal(r.code,410);assert.equal(r.next,false);});
test('blocks data records in mixed carts',()=>{const r=run({cartItems:[{type:'service',tierId:'simple'},{type:'data'}]});assert.equal(r.code,410);assert.equal(r.next,false);});
test('blocks legacy data tier stored as service',()=>assert.equal(run({cartItems:[{type:'service',tierId:'data'}]}).code,410));
test('preserves website checkout',()=>assert.equal(run({tier:'simple'}).next,true));
test('preserves website-only carts',()=>assert.equal(run({cartItems:[{type:'service',tierId:'simple'}]}).next,true));
test('leaves malformed request validation to checkout',()=>assert.equal(run(undefined).next,true));
