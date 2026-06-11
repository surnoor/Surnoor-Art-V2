const fs = require('fs');
const Stripe = require('stripe');
const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/STRIPE_SECRET_KEY=\"?(.*?)\"?\s*$/m);
if (!match) {
  console.log("No key found");
  process.exit(1);
}
const key = match[1];
const stripe = new Stripe(key);
stripe.products.list({limit: 1}).then(x => console.log("Success!")).catch(console.error);
