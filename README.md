# Description

feature switch handler

# Fonctionnement

## Wording

On appelle "Feature" un couple Key/Value tel que le clef Key est une chaine texte de la forme "A.B.C.(...).Z"
 et Value est baptisée "variant" tel qu'une Feature est active si "variant" !== "0"|"false"|"off"

Il existe deux catégories de features:
 - celles pré-embarquées dans l'application (features par défaut)
 - celles activées dynamiquement suivant le contenu des querystring|headers http.

## Features par défaut (pré-embarquées)

une feature par défaut est une feature pré-embarquée dans l'application
on peut lui appliquer des restrictions par IP ou de % de trafic.

la définition des features pré-embarquéesse fait au travers d'un fichier :

```
{
  feature_A: "variant_A",
  feature_B: { variant: "variant_B", rampedUp: 0.05, ipList: [ "192.168.0.5" ] }
}
```

## Features dynamiques

une feature dynamique est une feature activée par querystring|headers http
sur cette feature ne s'applique aucune restrictions par IP ou % de trafic

### query string

```
https://(...)/route?feature=variant
```

### headers

```
Features: feature=variant&toto=titi&...
```

## Une feature

il faut :
 - un middleware ajoutable dans les différents projets capable de prendre en compte les features

une feature est regardée :


# API

setup features par défaut

```js
const { Features } = require('afrostream-node-feature');
const features = new Features();
features.load({
  'feature': 'variant',
  'afrostream-back-end.config': '{"billings":{"url":"https://billings-api-pr440.herokuapp.com"}}'
});
const variant = features.getVariant('feature');
const isFeatureEnabled = features.isEnabled('feature');
```

recupération des features dynamiques

```js
const { middleware } = require('afrostream-node-feature');
app.use(middleware(features:features));

app.get('/*', (req, res) => {
  if (req.features.isEnabled('feature')) {
    // (...)
  }
})
```

# Exemples

```
features: {
  foo: 'on',
  bar: 'bar',
  nope: 'off',
  rampedUp: { variant: 'on', rampedUp: 0.33}
  ipList: { variant: 'on', ipList: [ /82\.228\.194\.\d+/ ]}
}
```

a pour conséquences :

```
/*
* si on request: api.afrostream.tv/(...)
* req.features.isEnabled('foo') va retourner true
* req.features.getVariant('foo') va retourner "on"
*
* req.features.isEnabled('bar') va retourner true
* req.features.getVariant('bar') va retourner "bar"
*
* req.features.isEnabled('nope') va retourner false
* req.features.getVariant('nope') va retourner "off"
*
* req.features.isEnabled('rampedUp') va retourner true 1 fois sur 3
* req.features.getVariant('rampedUp') va retourner "on" tout le temps
*
* req.features.isEnabled('ipList') va retourner true si la requête vient d'une ip dans la liste
* req.features.getVariant('ipList') va retourner "on" tout le temps
*
* si on request: api.afrostream.tv/(...)?foo=off&bar=on&nope=on&rampedUp=on&ipList=whatever
* req.features.isEnabled('foo') va retourner false
* req.features.getVariant('foo') va retourner "off"
* req.features.isEnabled('bar') va retourner true
* req.features.getVariant('bar') va retourner "on"
* req.features.isEnabled('nope') va retourner true
* req.features.getVariant('nope') va retourner "on"
* req.features.isEnabled('rampedUp') va retourner true tout le temps
* req.features.getVariant('rampedUp') va retourner "on"
* req.features.isEnabled('ipList') va retourner true  peu importel 'ip qui appelle'
* req.features.getVariant('ipList') va retourner "whatever"
*/
```
