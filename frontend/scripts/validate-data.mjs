import fs from 'node:fs';
import path from 'node:path';
const read=n=>JSON.parse(fs.readFileSync(`data/${n}.json`,'utf8'));
const products=read('products'),categories=read('categories'),settings=read('settings');
for(const rows of [products,categories]){
 if(new Set(rows.map(x=>x.id)).size!==rows.length||new Set(rows.map(x=>x.slug)).size!==rows.length)throw Error('Duplicate id/slug in catalog');
}
for(const product of products)if(!categories.some(c=>c.id===product.category_id))throw Error(`Missing category: ${product.slug}`);
for(const image of [settings.logo_url,settings.hero_image_url,...products.map(p=>p.image_url)].filter(Boolean)){
 if(!/^\/images\/[a-zA-Z0-9/_-]+\.(webp|avif|png|jpe?g)$/.test(image))throw Error(`Invalid local image path: ${image}`);
 const file=path.join('public',image);if(!fs.existsSync(file))throw Error(`Missing image: ${file}`);
 if(fs.statSync(file).size>1024*1024)throw Error(`Image exceeds 1 MB: ${file}`);
}
console.log(`Validated ${products.length} products, ${categories.length} categories and local images.`);
if(!settings.whatsapp)console.log('WhatsApp not configured: checkout will display a contact notice.');
if(settings.site_url==='https://example.com')console.log('Set settings.site_url to your production domain before publication.');
