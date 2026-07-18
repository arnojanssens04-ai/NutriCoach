/* ──────────────────────────────────────────────────────────────────────
   recettes-data.js — Données des recettes du plan alimentaire, partagées
   ──────────────────────────────────────────────────────────────────────
   Contient : le tableau RECIPES (source unique du plan alimentaire ET
   du mode cuisine recette-prep.html), la carte des catégories de goûts,
   et le générateur automatique d'étapes de préparation.

   IMPORTANT POUR LE DÉPLOIEMENT : comme regles-pathologies.js, ce fichier
   doit être uploadé au MÊME niveau que les fichiers .html.
   ────────────────────────────────────────────────────────────────────── */

var RECIPES = [
  // ── PETIT-DÉJEUNER ──
  {id:'b1', meal:'breakfast', nom:'Tartines, beurre & yaourt', excludeFor:['cholesterol','cardiac'], ing:[
    {code:'7001',nom:'Pain blanc',qty:80,kcal:287,prot:8.3,gluc:58.3,lip:1.4,ags:0.45,pot:180,unit:'g'},
    {code:'16400',nom:'Beurre',qty:10,kcal:753,prot:0.64,gluc:0.7,lip:83,ags:60,pot:36.1,unit:'noix',gpu:10},
    {code:'19554',nom:'Yaourt nature',qty:125,kcal:66.5,prot:5.6,gluc:3.5,lip:3.0,ags:2.13,pot:110,unit:'pot',gpu:125},
    {code:'13005',nom:'Banane',qty:120,kcal:87.6,prot:1.1,gluc:19.7,lip:0.5,ags:0.01,pot:320,unit:'fruit',gpu:120}
  ]},
  {id:'b2', meal:'breakfast', nom:'Œufs, pain & avocat', excludeFor:['diabetes'], ing:[
    {code:'7001',nom:'Pain blanc',qty:60,kcal:287,prot:8.3,gluc:58.3,lip:1.4,ags:0.45,pot:180,unit:'g'},
    {code:'22010',nom:'Œuf dur',qty:100,kcal:134,prot:13.5,gluc:0.5,lip:8.6,ags:3.22,pot:120,unit:'oeuf',gpu:50},
    {code:'13004',nom:'Avocat',qty:50,kcal:203,prot:1.6,gluc:0,lip:20.6,ags:4.51,pot:430,unit:'g'},
    {code:'13034',nom:'Orange',qty:150,kcal:42,prot:0.75,gluc:8.0,lip:0.5,ags:0.01,pot:180,unit:'fruit',gpu:150}
  ]},
  {id:'b3', meal:'breakfast', nom:"Flocons d'avoine & fruits", excludeFor:[], ing:[
    {code:'32140',nom:"Flocons d'avoine",qty:50,kcal:369,prot:10.6,gluc:57.7,lip:7.82,ags:1.4,pot:320,unit:'g'},
    {code:'19033',nom:'Lait demi-écrémé',qty:200,kcal:47.5,prot:3.5,gluc:5.0,lip:1.6,ags:0.98,pot:158,unit:'ml'},
    {code:'13039',nom:'Pomme',qty:150,kcal:54,prot:0.25,gluc:11.6,lip:0.3,ags:0.052,pot:119,unit:'fruit',gpu:150},
    {code:'15000',nom:'Amandes',qty:10,kcal:615,prot:18.8,gluc:9.5,lip:51.3,ags:4.11,pot:800,unit:'poignée',gpu:10}
  ]},
  {id:'b4', meal:'breakfast', nom:'Fromage blanc, pain & kiwi', excludeFor:['diabetes'], ing:[
    {code:'19501',nom:'Fromage blanc',qty:200,kcal:80,prot:7.0,gluc:6.3,lip:2.8,ags:1.83,pot:162,unit:'g'},
    {code:'7001',nom:'Pain blanc',qty:60,kcal:287,prot:8.3,gluc:58.3,lip:1.4,ags:0.45,pot:180,unit:'g'},
    {code:'13021',nom:'Kiwi',qty:90,kcal:60.9,prot:0.88,gluc:11.0,lip:0.6,ags:0.13,pot:290,unit:'fruit',gpu:90},
    {code:'15000',nom:'Amandes',qty:10,kcal:615,prot:18.8,gluc:9.5,lip:51.3,ags:4.11,pot:800,unit:'poignée',gpu:10}
  ]},
  // ── DÉJEUNER ──
  {id:'l1', meal:'lunch', nom:'Poulet, riz & brocoli', excludeFor:[], ing:[
    {code:'28963',nom:'Blanc de poulet',qty:150,kcal:105,prot:20.7,gluc:1.4,lip:1.8,ags:0.54,pot:380,unit:'g'},
    {code:'9104',nom:'Riz blanc cuit',qty:150,kcal:155,prot:3.2,gluc:33.2,lip:0.7,ags:0.17,pot:21.9,unit:'g'},
    {code:'20057',nom:'Brocoli',qty:150,kcal:31.9,prot:2.9,gluc:2.2,lip:0.4,ags:0.047,pot:321,unit:'g'},
    {code:'17270',nom:"Huile d'olive",qty:15,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'l2', meal:'lunch', nom:'Cabillaud, patate douce & courgette', excludeFor:[], ing:[
    {code:'25997',nom:'Cabillaud',qty:150,kcal:100,prot:23.3,gluc:0,lip:0.8,ags:0.17,pot:327,unit:'g'},
    {code:'4102',nom:'Patate douce cuite',qty:200,kcal:79.1,prot:1.7,gluc:16.3,lip:0.15,ags:0.042,pot:353,unit:'g'},
    {code:'20021',nom:'Courgette',qty:150,kcal:15.5,prot:0.9,gluc:1.4,lip:0.4,ags:0.1,pot:238,unit:'g'},
    {code:'17270',nom:"Huile d'olive",qty:15,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'l3', meal:'lunch', nom:'Saumon, quinoa & épinards', excludeFor:[], ing:[
    {code:'25996',nom:'Saumon',qty:130,kcal:205,prot:23.2,gluc:0.6,lip:12.2,ags:2.48,pot:383,unit:'g'},
    {code:'9341',nom:'Quinoa cuit',qty:120,kcal:149,prot:4.7,gluc:27.9,lip:1.1,ags:0.14,pot:220,unit:'g'},
    {code:'20083',nom:'Épinards',qty:150,kcal:28,prot:3.3,gluc:1.0,lip:0.5,ags:0.041,pot:346,unit:'g'},
    {code:'17270',nom:"Huile d'olive",qty:15,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'l4', meal:'lunch', nom:'Bœuf, pâtes complètes & carotte', excludeFor:[], ing:[
    {code:'6200',nom:'Steak de bœuf grillé',qty:130,kcal:128,prot:27.6,gluc:0,lip:2.0,ags:0.98,pot:371,unit:'g'},
    {code:'9813',nom:'Pâtes complètes cuites',qty:150,kcal:124,prot:5.3,gluc:23.6,lip:0.9,ags:0.17,pot:80,unit:'g'},
    {code:'20009',nom:'Carotte',qty:100,kcal:30.2,prot:0.78,gluc:5.2,lip:0.3,ags:0.15,pot:274,unit:'g'},
    {code:'17130',nom:'Huile de colza',qty:15,kcal:900,prot:0,gluc:0,lip:100,ags:7.26,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'l5', meal:'lunch', nom:'Tofu, boulgour & poivron', excludeFor:[], ing:[
    {code:'20904',nom:'Tofu nature',qty:150,kcal:147,prot:13.4,gluc:2.9,lip:8.5,ags:1.35,pot:140,unit:'g'},
    {code:'9691',nom:'Boulgour cuit',qty:150,kcal:131,prot:4.3,gluc:24.1,lip:1.0,ags:0.16,pot:67.1,unit:'g'},
    {code:'20087',nom:'Poivron rouge',qty:100,kcal:33.6,prot:1.1,gluc:6.0,lip:0.3,ags:0.01,pot:180,unit:'g'},
    {code:'17270',nom:"Huile d'olive",qty:15,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  // ── SOUPER ──
  {id:'d1', meal:'dinner', nom:'Colin, pomme de terre & haricots verts', excludeFor:[], ing:[
    {code:'26192',nom:'Colin (lieu jaune)',qty:140,kcal:97.8,prot:24.4,gluc:0,lip:0.5,ags:0.01,pot:388,unit:'g'},
    {code:'4048',nom:'Pomme de terre cuite',qty:180,kcal:94.9,prot:2.1,gluc:17.2,lip:1.6,ags:0.44,pot:457,unit:'g'},
    {code:'20030',nom:'Haricots verts',qty:150,kcal:29.4,prot:2.0,gluc:3.0,lip:0.2,ags:0.059,pot:174,unit:'g'},
    {code:'17270',nom:"Huile d'olive",qty:15,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'d2', meal:'dinner', nom:'Dinde, riz & chou-fleur', excludeFor:[], ing:[
    {code:'36302',nom:'Dinde rôtie',qty:130,kcal:151,prot:29.1,gluc:0,lip:3.8,ags:1.13,pot:483,unit:'g'},
    {code:'9104',nom:'Riz blanc cuit',qty:120,kcal:155,prot:3.2,gluc:33.2,lip:0.7,ags:0.17,pot:21.9,unit:'g'},
    {code:'20016',nom:'Chou-fleur',qty:150,kcal:24.9,prot:1.8,gluc:2.1,lip:0.7,ags:0.24,pot:270,unit:'g'},
    {code:'17130',nom:'Huile de colza',qty:15,kcal:900,prot:0,gluc:0,lip:100,ags:7.26,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'d3', meal:'dinner', nom:'Saumon, patate douce & salade', excludeFor:[], ing:[
    {code:'25996',nom:'Saumon',qty:120,kcal:205,prot:23.2,gluc:0.6,lip:12.2,ags:2.48,pot:383,unit:'g'},
    {code:'4102',nom:'Patate douce cuite',qty:150,kcal:79.1,prot:1.7,gluc:16.3,lip:0.15,ags:0.042,pot:353,unit:'g'},
    {code:'25604',nom:'Salade verte',qty:100,kcal:13.5,prot:1.0,gluc:1.5,lip:0.1,ags:0.028,pot:260,unit:'g'},
    {code:'17270',nom:"Huile d'olive",qty:15,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'d4', meal:'dinner', nom:'Œufs, pâtes complètes & courgette', excludeFor:[], ing:[
    {code:'22010',nom:'Œuf dur',qty:100,kcal:134,prot:13.5,gluc:0.5,lip:8.6,ags:3.22,pot:120,unit:'oeuf',gpu:50},
    {code:'9813',nom:'Pâtes complètes cuites',qty:100,kcal:124,prot:5.3,gluc:23.6,lip:0.9,ags:0.17,pot:80,unit:'g'},
    {code:'20021',nom:'Courgette',qty:150,kcal:15.5,prot:0.9,gluc:1.4,lip:0.4,ags:0.1,pot:238,unit:'g'},
    {code:'17270',nom:"Huile d'olive",qty:15,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'b5', meal:'breakfast', nom:'Pain, beurre & œuf', excludeFor:['cholesterol','cardiac'], ing:[
    {code:'7001',nom:'Pain blanc',qty:70,kcal:287,prot:8.3,gluc:58.3,lip:1.4,ags:0.45,pot:180,unit:'g'},
    {code:'16400',nom:'Beurre',qty:10,kcal:753,prot:0.64,gluc:0.7,lip:83,ags:60,pot:36.1,unit:'noix',gpu:10},
    {code:'22010',nom:'Œuf dur',qty:100,kcal:134,prot:13.5,gluc:0.5,lip:8.6,ags:3.22,pot:120,unit:'oeuf',gpu:50},
    {code:'13039',nom:'Pomme',qty:150,kcal:54,prot:0.25,gluc:11.6,lip:0.3,ags:0.052,pot:119,unit:'fruit',gpu:150}
  ]},
  {id:'b6', meal:'breakfast', nom:'Avoine, beurre & banane', excludeFor:['cholesterol','cardiac'], ing:[
    {code:'32140',nom:"Flocons d'avoine",qty:50,kcal:369,prot:10.6,gluc:57.7,lip:7.82,ags:1.4,pot:320,unit:'g'},
    {code:'19033',nom:'Lait demi-écrémé',qty:200,kcal:47.5,prot:3.5,gluc:5.0,lip:1.6,ags:0.98,pot:158,unit:'ml'},
    {code:'16400',nom:'Beurre',qty:8,kcal:753,prot:0.64,gluc:0.7,lip:83,ags:60,pot:36.1,unit:'noix',gpu:10},
    {code:'13005',nom:'Banane',qty:120,kcal:87.6,prot:1.1,gluc:19.7,lip:0.5,ags:0.01,pot:320,unit:'fruit',gpu:120}
  ]},
  {id:'b7', meal:'breakfast', nom:'Œufs, avocat & tomate', excludeFor:[], ing:[
    {code:'22010',nom:'Œuf dur',qty:100,kcal:134,prot:13.5,gluc:0.5,lip:8.6,ags:3.22,pot:120,unit:'oeuf',gpu:50},
    {code:'13004',nom:'Avocat',qty:80,kcal:203,prot:1.6,gluc:0,lip:20.6,ags:4.51,pot:430,unit:'g'},
    {code:'20111',nom:'Tomate',qty:150,kcal:18,prot:0.9,gluc:2.9,lip:0.2,ags:0.03,pot:237,unit:'g'}
  ]},
  {id:'b8', meal:'breakfast', nom:'Fromage blanc, framboises & amandes', excludeFor:[], ing:[
    {code:'19501',nom:'Fromage blanc',qty:150,kcal:80,prot:7.0,gluc:6.3,lip:2.8,ags:1.83,pot:162,unit:'g'},
    {code:'13057',nom:'Framboises',qty:100,kcal:33,prot:1.2,gluc:4.4,lip:0.4,ags:0.02,pot:151,unit:'g'},
    {code:'15000',nom:'Amandes',qty:15,kcal:615,prot:18.8,gluc:9.5,lip:51.3,ags:4.11,pot:800,unit:'poignée',gpu:10}
  ]},
  {id:'b9', meal:'breakfast', nom:'Yaourt, myrtilles & noix', excludeFor:[], ing:[
    {code:'19554',nom:'Yaourt nature',qty:125,kcal:66.5,prot:5.6,gluc:3.5,lip:3.0,ags:2.13,pot:110,unit:'pot',gpu:125},
    {code:'13058',nom:'Myrtilles',qty:120,kcal:36,prot:0.6,gluc:8.0,lip:0.3,ags:0.02,pot:78,unit:'g'},
    {code:'15005',nom:'Noix',qty:15,kcal:709,prot:13.3,gluc:6.9,lip:67.3,ags:6.45,pot:430,unit:'poignée',gpu:10}
  ]},
  {id:'b10', meal:'breakfast', nom:'Pain complet, beurre & yaourt', excludeFor:['cholesterol','cardiac'], ing:[
    {code:'7004',nom:'Pain complet',qty:70,kcal:246,prot:8.8,gluc:41.4,lip:2.7,ags:0.5,pot:230,unit:'g'},
    {code:'16400',nom:'Beurre',qty:10,kcal:753,prot:0.64,gluc:0.7,lip:83,ags:60,pot:36.1,unit:'noix',gpu:10},
    {code:'19554',nom:'Yaourt nature',qty:125,kcal:66.5,prot:5.6,gluc:3.5,lip:3.0,ags:2.13,pot:110,unit:'pot',gpu:125}
  ]},
  {id:'b11', meal:'breakfast', nom:'Pain complet, œuf & avocat', excludeFor:[], ing:[
    {code:'7004',nom:'Pain complet',qty:60,kcal:246,prot:8.8,gluc:41.4,lip:2.7,ags:0.5,pot:230,unit:'g'},
    {code:'22010',nom:'Œuf dur',qty:100,kcal:134,prot:13.5,gluc:0.5,lip:8.6,ags:3.22,pot:120,unit:'oeuf',gpu:50},
    {code:'13004',nom:'Avocat',qty:60,kcal:203,prot:1.6,gluc:0,lip:20.6,ags:4.51,pot:430,unit:'g'}
  ]},
  {id:'l6', meal:'lunch', nom:'Poulet, riz & courgette au beurre', excludeFor:['cholesterol','cardiac'], ing:[
    {code:'28963',nom:'Blanc de poulet',qty:150,kcal:105,prot:20.7,gluc:1.4,lip:1.8,ags:0.54,pot:380,unit:'g'},
    {code:'9104',nom:'Riz blanc cuit',qty:150,kcal:155,prot:3.2,gluc:33.2,lip:0.7,ags:0.17,pot:21.9,unit:'g'},
    {code:'20021',nom:'Courgette',qty:150,kcal:15.5,prot:0.9,gluc:1.4,lip:0.4,ags:0.1,pot:238,unit:'g'},
    {code:'16400',nom:'Beurre',qty:10,kcal:753,prot:0.64,gluc:0.7,lip:83,ags:60,pot:36.1,unit:'noix',gpu:10}
  ]},
  {id:'l7', meal:'lunch', nom:'Saumon, pâtes complètes & brocoli', excludeFor:[], ing:[
    {code:'25996',nom:'Saumon',qty:130,kcal:205,prot:23.2,gluc:0.6,lip:12.2,ags:2.48,pot:383,unit:'g'},
    {code:'9813',nom:'Pâtes complètes cuites',qty:150,kcal:124,prot:5.3,gluc:23.6,lip:0.9,ags:0.17,pot:80,unit:'g'},
    {code:'20057',nom:'Brocoli',qty:150,kcal:31.9,prot:2.9,gluc:2.2,lip:0.4,ags:0.047,pot:321,unit:'g'},
    {code:'17270',nom:"Huile d'olive",qty:15,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'d5', meal:'dinner', nom:'Dinde, pâtes complètes & épinards au beurre', excludeFor:['cholesterol','cardiac'], ing:[
    {code:'36302',nom:'Dinde rôtie',qty:130,kcal:151,prot:29.1,gluc:0,lip:3.8,ags:1.13,pot:483,unit:'g'},
    {code:'9813',nom:'Pâtes complètes cuites',qty:130,kcal:124,prot:5.3,gluc:23.6,lip:0.9,ags:0.17,pot:80,unit:'g'},
    {code:'20083',nom:'Épinards',qty:150,kcal:28,prot:3.3,gluc:1.0,lip:0.5,ags:0.041,pot:346,unit:'g'},
    {code:'16400',nom:'Beurre',qty:10,kcal:753,prot:0.64,gluc:0.7,lip:83,ags:60,pot:36.1,unit:'noix',gpu:10}
  ]},
  {id:'d6', meal:'dinner', nom:'Cabillaud, riz & carotte', excludeFor:[], ing:[
    {code:'25997',nom:'Cabillaud',qty:150,kcal:100,prot:23.3,gluc:0,lip:0.8,ags:0.17,pot:327,unit:'g'},
    {code:'9104',nom:'Riz blanc cuit',qty:150,kcal:155,prot:3.2,gluc:33.2,lip:0.7,ags:0.17,pot:21.9,unit:'g'},
    {code:'20009',nom:'Carotte',qty:120,kcal:30.2,prot:0.78,gluc:5.2,lip:0.3,ags:0.15,pot:274,unit:'g'},
    {code:'17130',nom:'Huile de colza',qty:15,kcal:900,prot:0,gluc:0,lip:100,ags:7.26,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  // ── COLLATION ──
  {id:'s1', meal:'snack', nom:'Yaourt & banane', excludeFor:[], ing:[
    {code:'19554',nom:'Yaourt nature',qty:125,kcal:66.5,prot:5.6,gluc:3.5,lip:3.0,ags:2.13,pot:110,unit:'pot',gpu:125},
    {code:'13005',nom:'Banane',qty:120,kcal:87.6,prot:1.1,gluc:19.7,lip:0.5,ags:0.01,pot:320,unit:'fruit',gpu:120}
  ]},
  {id:'s2', meal:'snack', nom:'Fromage blanc & pêche', excludeFor:[], ing:[
    {code:'19501',nom:'Fromage blanc',qty:125,kcal:80,prot:7.0,gluc:6.3,lip:2.8,ags:1.83,pot:162,unit:'g'},
    {code:'13043',nom:'Pêche',qty:130,kcal:37.9,prot:0.91,gluc:7.6,lip:0.25,ags:0.019,pot:215,unit:'fruit',gpu:130}
  ]},
  {id:'s3', meal:'snack', nom:'Pomme & amandes', excludeFor:[], ing:[
    {code:'13039',nom:'Pomme',qty:150,kcal:54,prot:0.25,gluc:11.6,lip:0.3,ags:0.052,pot:119,unit:'fruit',gpu:150},
    {code:'15000',nom:'Amandes',qty:15,kcal:615,prot:18.8,gluc:9.5,lip:51.3,ags:4.11,pot:800,unit:'poignée',gpu:10}
  ]},
  {id:'s4', meal:'snack', nom:'Fromage blanc & kiwi', excludeFor:[], ing:[
    {code:'19501',nom:'Fromage blanc',qty:125,kcal:80,prot:7.0,gluc:6.3,lip:2.8,ags:1.83,pot:162,unit:'g'},
    {code:'13021',nom:'Kiwi',qty:90,kcal:60.9,prot:0.88,gluc:11.0,lip:0.6,ags:0.13,pot:290,unit:'fruit',gpu:90}
  ]},
  {id:'s5', meal:'snack', nom:'Yaourt & pomme', excludeFor:[], ing:[
    {code:'19554',nom:'Yaourt nature',qty:125,kcal:66.5,prot:5.6,gluc:3.5,lip:3.0,ags:2.13,pot:110,unit:'pot',gpu:125},
    {code:'13039',nom:'Pomme',qty:150,kcal:54,prot:0.25,gluc:11.6,lip:0.3,ags:0.052,pot:119,unit:'fruit',gpu:150}
  ]},
  {id:'l8', meal:'lunch', nom:'Lentilles, riz complet & carotte', excludeFor:[], ing:[
    {code:'20429',nom:'Lentilles cuites',qty:180,kcal:116,prot:9.0,gluc:20.0,lip:0.4,ags:0.06,pot:369,unit:'g'},
    {code:'9410',nom:'Riz complet cuit',qty:120,kcal:123,prot:2.7,gluc:25.8,lip:1.0,ags:0.2,pot:86,unit:'g'},
    {code:'20009',nom:'Carotte',qty:100,kcal:30.2,prot:0.78,gluc:5.2,lip:0.3,ags:0.15,pot:274,unit:'g'},
    {code:'17270',nom:"Huile d'olive",qty:15,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'l9', meal:'lunch', nom:'Pois chiches, quinoa & poivron', excludeFor:[], ing:[
    {code:'20410',nom:'Pois chiches cuits',qty:170,kcal:164,prot:8.9,gluc:27.4,lip:2.6,ags:0.27,pot:291,unit:'g'},
    {code:'9341',nom:'Quinoa cuit',qty:100,kcal:149,prot:4.7,gluc:27.9,lip:1.1,ags:0.14,pot:220,unit:'g'},
    {code:'20087',nom:'Poivron rouge',qty:120,kcal:33.6,prot:1.1,gluc:6.0,lip:0.3,ags:0.01,pot:180,unit:'g'},
    {code:'17270',nom:"Huile d'olive",qty:15,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'d7', meal:'dinner', nom:'Haricots rouges, riz complet & courgette', excludeFor:[], ing:[
    {code:'20425',nom:'Haricots rouges cuits',qty:170,kcal:127,prot:8.7,gluc:21.4,lip:0.5,ags:0.07,pot:403,unit:'g'},
    {code:'9410',nom:'Riz complet cuit',qty:110,kcal:123,prot:2.7,gluc:25.8,lip:1.0,ags:0.2,pot:86,unit:'g'},
    {code:'20021',nom:'Courgette',qty:130,kcal:15.5,prot:0.9,gluc:1.4,lip:0.4,ags:0.1,pot:238,unit:'g'},
    {code:'17130',nom:'Huile de colza',qty:15,kcal:900,prot:0,gluc:0,lip:100,ags:7.26,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  // ── COLLATION 2 (haut besoin calorique, ≥3000kcal) ──
  {id:'s2_1', meal:'snack2', nom:'Œuf & amandes', excludeFor:[], ing:[
    {code:'22010',nom:'Œuf dur',qty:100,kcal:134,prot:13.5,gluc:0.5,lip:8.6,ags:3.22,pot:120,unit:'oeuf',gpu:50},
    {code:'15000',nom:'Amandes',qty:20,kcal:615,prot:18.8,gluc:9.5,lip:51.3,ags:4.11,pot:800,unit:'poignée',gpu:10}
  ]},
  {id:'s2_2', meal:'snack2', nom:'Fromage blanc & noix', excludeFor:[], ing:[
    {code:'19501',nom:'Fromage blanc',qty:150,kcal:80,prot:7.0,gluc:6.3,lip:2.8,ags:1.83,pot:162,unit:'g'},
    {code:'15005',nom:'Noix',qty:15,kcal:709,prot:13.3,gluc:6.9,lip:67.3,ags:6.45,pot:430,unit:'poignée',gpu:10}
  ]},
  {id:'b17', meal:'breakfast', nom:'Pain de seigle, chèvre frais & raisin', excludeFor:[], ing:[
    {code:'7125',nom:'Pain de seigle',qty:60,kcal:260,prot:8.27,gluc:51.5,lip:1,ags:0.32,pot:170,unit:'g'},
    {code:'12805',nom:'Fromage de chèvre frais',qty:30,kcal:194,prot:12,gluc:2.5,lip:15.2,ags:10.7,pot:159,unit:'g'},
    {code:'13045',nom:'Raisin',qty:80,kcal:69.5,prot:0.57,gluc:15.6,lip:0.25,ags:0.08,pot:172,unit:'g'},
    {code:'15000',nom:'Amandes',qty:10,kcal:615,prot:18.8,gluc:9.5,lip:51.3,ags:4.11,pot:800,unit:'g'}
  ]},
  {id:'b18', meal:'breakfast', nom:'Porridge, graines de chia & framboises', excludeFor:[], ing:[
    {code:'9500b',nom:'Flocons d\'avoine',qty:40,kcal:369,prot:10.6,gluc:57.7,lip:7.82,ags:1.4,pot:320,unit:'g'},
    {code:'19033',nom:'Lait demi-écrémé',qty:180,kcal:47.5,prot:3.5,gluc:5,lip:1.6,ags:0.98,pot:158,unit:'g'},
    {code:'15047',nom:'Graines de chia',qty:15,kcal:454,prot:16.5,gluc:7.72,lip:30.7,ags:3.33,pot:407,unit:'g'},
    {code:'13057',nom:'Framboises',qty:70,kcal:33,prot:1.2,gluc:4.4,lip:0.4,ags:0.02,pot:151,unit:'g'}
  ]},
  {id:'b19', meal:'breakfast', nom:'Yaourt, flocons d\'avoine & pruneaux', excludeFor:[], ing:[
    {code:'19554',nom:'Yaourt nature',qty:150,kcal:66.5,prot:5.6,gluc:3.5,lip:3,ags:2.13,pot:110,unit:'g'},
    {code:'9500b',nom:'Flocons d\'avoine',qty:30,kcal:369,prot:10.6,gluc:57.7,lip:7.82,ags:1.4,pot:320,unit:'g'},
    {code:'13042',nom:'Pruneaux',qty:30,kcal:229,prot:1.63,gluc:55.4,lip:0.4,ags:0.16,pot:610,unit:'g'},
    {code:'15004',nom:'Noisettes',qty:10,kcal:632,prot:14.4,gluc:7.16,lip:56.9,ags:4.75,pot:860,unit:'g'}
  ]},
  {id:'b20', meal:'breakfast', nom:'Faisselle, mangue & graines de lin', excludeFor:[], ing:[
    {code:'19639',nom:'Faisselle 0%',qty:180,kcal:36.8,prot:4.52,gluc:4.65,lip:0.05,ags:0.025,pot:151,unit:'g'},
    {code:'13025',nom:'Mangue',qty:110,kcal:71.1,prot:0.63,gluc:14.3,lip:0.1,ags:0.01,pot:150,unit:'g'},
    {code:'15034',nom:'Graines de lin',qty:10,kcal:528,prot:19,gluc:6.49,lip:40.3,ags:4.26,pot:840,unit:'g'}
  ]},
  {id:'b21', meal:'breakfast', nom:'Pain complet, houmous & tomate', excludeFor:[], ing:[
    {code:'7004',nom:'Pain complet',qty:60,kcal:246,prot:8.8,gluc:41.4,lip:2.7,ags:0.5,pot:230,unit:'g'},
    {code:'25621',nom:'Houmous',qty:45,kcal:258,prot:8.06,gluc:9,lip:19.9,ags:2.02,pot:250,unit:'g'},
    {code:'20066',nom:'Tomate',qty:70,kcal:17.6,prot:0.9,gluc:2.9,lip:0.3,ags:0.02,pot:237,unit:'g'}
  ]},
  {id:'b22', meal:'breakfast', nom:'Œufs, champignons & pain de seigle', excludeFor:[], ing:[
    {code:'22010',nom:'Œuf dur',qty:100,kcal:134,prot:13.5,gluc:0.5,lip:8.6,ags:3.22,pot:120,unit:'g'},
    {code:'20102',nom:'Champignons de Paris',qty:80,kcal:28.7,prot:2.17,gluc:3,lip:0.47,ags:0.061,pot:356,unit:'g'},
    {code:'7125',nom:'Pain de seigle',qty:40,kcal:260,prot:8.27,gluc:51.5,lip:1,ags:0.32,pot:170,unit:'g'}
  ]},
  {id:'b23', meal:'breakfast', nom:'Fromage blanc, cerises & amandes', excludeFor:[], ing:[
    {code:'19501',nom:'Fromage blanc',qty:180,kcal:80,prot:7,gluc:6.3,lip:2.8,ags:1.83,pot:162,unit:'g'},
    {code:'13008',nom:'Cerises',qty:110,kcal:53.7,prot:0.81,gluc:13,lip:0.1,ags:0.01,pot:190,unit:'g'},
    {code:'15000',nom:'Amandes',qty:10,kcal:615,prot:18.8,gluc:9.5,lip:51.3,ags:4.11,pot:800,unit:'g'}
  ]},
  {id:'b12', meal:'breakfast', nom:'Jambon de dinde, pain complet & avocat', excludeFor:['hypertension'], ing:[
    {code:'28964',nom:'Jambon de dinde',qty:40,kcal:99.3,prot:20.9,gluc:0,lip:1.67,ags:0.54,pot:370,unit:'g'},
    {code:'7004',nom:'Pain complet',qty:50,kcal:246,prot:8.8,gluc:41.4,lip:2.7,ags:0.5,pot:230,unit:'g'},
    {code:'13004',nom:'Avocat',qty:40,kcal:203,prot:1.6,gluc:0,lip:20.6,ags:4.51,pot:430,unit:'g'},
    {code:'20066',nom:'Tomate',qty:50,kcal:17.6,prot:0.9,gluc:2.9,lip:0.3,ags:0.02,pot:237,unit:'g'}
  ]},
  {id:'b13', meal:'breakfast', nom:'Yaourt, mangue, ananas & noix de cajou', excludeFor:[], ing:[
    {code:'19554',nom:'Yaourt nature',qty:150,kcal:66.5,prot:5.6,gluc:3.5,lip:3,ags:2.13,pot:110,unit:'g'},
    {code:'13025',nom:'Mangue',qty:80,kcal:71.1,prot:0.63,gluc:14.3,lip:0.1,ags:0.01,pot:150,unit:'g'},
    {code:'13002',nom:'Ananas',qty:60,kcal:51.6,prot:0.25,gluc:11.7,lip:0.1,ags:0.01,pot:140,unit:'g'},
    {code:'15054',nom:'Noix de cajou',qty:10,kcal:618,prot:17.4,gluc:21.3,lip:48.1,ags:8.24,pot:610,unit:'g'}
  ]},
  {id:'b14', meal:'breakfast', nom:'Muesli maison, lait & abricots', excludeFor:[], ing:[
    {code:'9500b',nom:'Flocons d\'avoine',qty:40,kcal:369,prot:10.6,gluc:57.7,lip:7.82,ags:1.4,pot:320,unit:'g'},
    {code:'19033',nom:'Lait demi-écrémé',qty:180,kcal:47.5,prot:3.5,gluc:5,lip:1.6,ags:0.98,pot:158,unit:'g'},
    {code:'13000',nom:'Abricots',qty:110,kcal:44.1,prot:0.81,gluc:9.01,lip:0.1,ags:0.01,pot:260,unit:'g'},
    {code:'15004',nom:'Noisettes',qty:10,kcal:632,prot:14.4,gluc:7.16,lip:56.9,ags:4.75,pot:860,unit:'g'}
  ]},
  {id:'b15', meal:'breakfast', nom:'Pain aux céréales, fromage blanc & kiwi', excludeFor:[], ing:[
    {code:'7098',nom:'Pain aux céréales',qty:50,kcal:282,prot:8.27,gluc:39.7,lip:7.6,ags:0.76,pot:230,unit:'g'},
    {code:'19501',nom:'Fromage blanc',qty:120,kcal:80,prot:7,gluc:6.3,lip:2.8,ags:1.83,pot:162,unit:'g'},
    {code:'13021',nom:'Kiwi',qty:90,kcal:60.9,prot:0.88,gluc:11,lip:0.6,ags:0.13,pot:290,unit:'g'}
  ]},
  {id:'b16', meal:'breakfast', nom:'Œuf dur, avocat & pain de seigle', excludeFor:[], ing:[
    {code:'22010',nom:'Œuf dur',qty:100,kcal:134,prot:13.5,gluc:0.5,lip:8.6,ags:3.22,pot:120,unit:'g'},
    {code:'13004',nom:'Avocat',qty:50,kcal:203,prot:1.6,gluc:0,lip:20.6,ags:4.51,pot:430,unit:'g'},
    {code:'7125',nom:'Pain de seigle',qty:50,kcal:260,prot:8.27,gluc:51.5,lip:1,ags:0.32,pot:170,unit:'g'}
  ]},
  {id:'l19', meal:'lunch', nom:'Crevettes, riz complet & petits pois', excludeFor:[], ing:[
    {code:'10006',nom:'Crevettes cuites',qty:160,kcal:89.4,prot:19.4,gluc:0.47,lip:1.1,ags:0.31,pot:97,unit:'g'},
    {code:'9814',nom:'Riz complet cuit',qty:160,kcal:111,prot:2.6,gluc:23,lip:0.9,ags:0.18,pot:79,unit:'g'},
    {code:'20036',nom:'Petits pois',qty:110,kcal:92.5,prot:4.87,gluc:13.7,lip:0.8,ags:0.15,pot:106,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'l20', meal:'lunch', nom:'Filet mignon de porc, pomme de terre & haricots verts', excludeFor:[], ing:[
    {code:'28203',nom:'Filet mignon de porc',qty:130,kcal:168,prot:26.1,gluc:0,lip:7.1,ags:2.58,pot:344,unit:'g'},
    {code:'9500',nom:'Pomme de terre cuite',qty:190,kcal:77,prot:2,gluc:17,lip:0.1,ags:0.02,pot:379,unit:'g'},
    {code:'20030',nom:'Haricots verts',qty:130,kcal:24.9,prot:1.7,gluc:3.3,lip:0.2,ags:0.04,pot:205,unit:'g'},
    {code:'17130',nom:'Huile de colza',qty:10,kcal:900,prot:0,gluc:0,lip:100,ags:7.26,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'l21', meal:'lunch', nom:'Gigot d\'agneau, quinoa & courgette', excludeFor:[], ing:[
    {code:'21503',nom:'Gigot d\'agneau rôti',qty:120,kcal:169,prot:26.8,gluc:0,lip:6.85,ags:2.63,pot:301,unit:'g'},
    {code:'9341',nom:'Quinoa cuit',qty:140,kcal:149,prot:4.7,gluc:27.9,lip:1.1,ags:0.14,pot:220,unit:'g'},
    {code:'20021',nom:'Courgette',qty:140,kcal:15.5,prot:0.9,gluc:1.4,lip:0.4,ags:0.1,pot:238,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'l22', meal:'lunch', nom:'Thon, boulgour & poivron', excludeFor:[], ing:[
    {code:'26039',nom:'Thon au naturel',qty:140,kcal:143,prot:26.8,gluc:0,lip:3.94,ags:1.01,pot:207,unit:'g'},
    {code:'9691',nom:'Boulgour cuit',qty:150,kcal:131,prot:4.3,gluc:24.1,lip:1,ags:0.16,pot:67.1,unit:'g'},
    {code:'20087',nom:'Poivron rouge',qty:110,kcal:33.6,prot:1.1,gluc:6,lip:0.3,ags:0.01,pot:180,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'l10', meal:'lunch', nom:'Lapin, riz complet & carotte', excludeFor:[], ing:[
    {code:'34002',nom:'Lapin cuit',qty:130,kcal:167,prot:20.5,gluc:0.5,lip:9.2,ags:3.42,pot:340,unit:'g'},
    {code:'9814',nom:'Riz complet cuit',qty:160,kcal:111,prot:2.6,gluc:23,lip:0.9,ags:0.18,pot:79,unit:'g'},
    {code:'20009',nom:'Carotte',qty:120,kcal:30.2,prot:0.78,gluc:5.2,lip:0.3,ags:0.15,pot:274,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'l11', meal:'lunch', nom:'Tempeh, riz complet & brocoli', excludeFor:[], ing:[
    {code:'20917',nom:'Tempeh',qty:140,kcal:157,prot:16.1,gluc:7.89,lip:4.7,ags:0.57,pot:310,unit:'g'},
    {code:'9814',nom:'Riz complet cuit',qty:150,kcal:111,prot:2.6,gluc:23,lip:0.9,ags:0.18,pot:79,unit:'g'},
    {code:'20057',nom:'Brocoli',qty:140,kcal:31.9,prot:2.9,gluc:2.2,lip:0.4,ags:0.047,pot:321,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'l12', meal:'lunch', nom:'Haricots blancs, épinards & pain complet', excludeFor:[], ing:[
    {code:'20502',nom:'Haricots blancs cuits',qty:200,kcal:112,prot:6.75,gluc:12,lip:1.1,ags:0.25,pot:260,unit:'g'},
    {code:'20083',nom:'Épinards',qty:110,kcal:28,prot:3.3,gluc:1,lip:0.5,ags:0.041,pot:346,unit:'g'},
    {code:'7004',nom:'Pain complet',qty:40,kcal:246,prot:8.8,gluc:41.4,lip:2.7,ags:0.5,pot:230,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'l13', meal:'lunch', nom:'Escalope de dinde, patate douce & asperges', excludeFor:[], ing:[
    {code:'36306',nom:'Escalope de dinde',qty:140,kcal:124,prot:28.5,gluc:0,lip:1.09,ags:0.51,pot:462,unit:'g'},
    {code:'4102',nom:'Patate douce cuite',qty:180,kcal:79.1,prot:1.7,gluc:16.3,lip:0.15,ags:0.042,pot:353,unit:'g'},
    {code:'20277',nom:'Asperges',qty:140,kcal:17.3,prot:1.44,gluc:1.63,lip:0.3,ags:0.1,pot:120,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'l14', meal:'lunch', nom:'Sardines, pomme de terre & salade', excludeFor:[], ing:[
    {code:'26040',nom:'Sardines à l\'huile d\'olive',qty:100,kcal:224,prot:23.3,gluc:0.11,lip:14.5,ags:3.07,pot:412,unit:'g'},
    {code:'9500',nom:'Pomme de terre cuite',qty:180,kcal:77,prot:2,gluc:17,lip:0.1,ags:0.02,pot:379,unit:'g'},
    {code:'20047',nom:'Salade verte',qty:60,kcal:13.5,prot:1.2,gluc:1.3,lip:0.2,ags:0.02,pot:194,unit:'g'}
  ]},
  {id:'l15', meal:'lunch', nom:'Œufs, riz complet & champignons', excludeFor:[], ing:[
    {code:'22010',nom:'Œuf dur',qty:100,kcal:134,prot:13.5,gluc:0.5,lip:8.6,ags:3.22,pot:120,unit:'g'},
    {code:'9814',nom:'Riz complet cuit',qty:150,kcal:111,prot:2.6,gluc:23,lip:0.9,ags:0.18,pot:79,unit:'g'},
    {code:'20102',nom:'Champignons de Paris',qty:110,kcal:28.7,prot:2.17,gluc:3,lip:0.47,ags:0.061,pot:356,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'l16', meal:'lunch', nom:'Poulet, boulgour & aubergine', excludeFor:[], ing:[
    {code:'28963',nom:'Blanc de poulet',qty:150,kcal:105,prot:20.7,gluc:1.4,lip:1.8,ags:0.54,pot:380,unit:'g'},
    {code:'9691',nom:'Boulgour cuit',qty:150,kcal:131,prot:4.3,gluc:24.1,lip:1,ags:0.16,pot:67.1,unit:'g'},
    {code:'20002',nom:'Aubergine cuite',qty:150,kcal:27.1,prot:0.83,gluc:4.17,lip:0.23,ags:0.044,pot:123,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'l17', meal:'lunch', nom:'Saumon, riz complet & fenouil', excludeFor:[], ing:[
    {code:'25996',nom:'Saumon',qty:130,kcal:205,prot:23.2,gluc:0.6,lip:12.2,ags:2.48,pot:383,unit:'g'},
    {code:'9814',nom:'Riz complet cuit',qty:150,kcal:111,prot:2.6,gluc:23,lip:0.9,ags:0.18,pot:79,unit:'g'},
    {code:'20028',nom:'Fenouil',qty:110,kcal:18.2,prot:1,gluc:2.63,lip:0.1,ags:0.01,pot:320,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'l18', meal:'lunch', nom:'Pois chiches, quinoa & tomate', excludeFor:[], ing:[
    {code:'20065',nom:'Pois chiches cuits',qty:160,kcal:164,prot:8.9,gluc:27.4,lip:2.6,ags:0.27,pot:290,unit:'g'},
    {code:'9341',nom:'Quinoa cuit',qty:140,kcal:149,prot:4.7,gluc:27.9,lip:1.1,ags:0.14,pot:220,unit:'g'},
    {code:'20066',nom:'Tomate',qty:110,kcal:17.6,prot:0.9,gluc:2.9,lip:0.3,ags:0.02,pot:237,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'d8', meal:'dinner', nom:'Cabillaud, riz complet & fenouil', excludeFor:[], ing:[
    {code:'25997',nom:'Cabillaud',qty:150,kcal:100,prot:23.3,gluc:0,lip:0.8,ags:0.17,pot:327,unit:'g'},
    {code:'9814',nom:'Riz complet cuit',qty:150,kcal:111,prot:2.6,gluc:23,lip:0.9,ags:0.18,pot:79,unit:'g'},
    {code:'20028',nom:'Fenouil',qty:130,kcal:18.2,prot:1,gluc:2.63,lip:0.1,ags:0.01,pot:320,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'d9', meal:'dinner', nom:'Escalope de dinde, patate douce & haricots verts', excludeFor:[], ing:[
    {code:'36306',nom:'Escalope de dinde',qty:140,kcal:124,prot:28.5,gluc:0,lip:1.09,ags:0.51,pot:462,unit:'g'},
    {code:'4102',nom:'Patate douce cuite',qty:180,kcal:79.1,prot:1.7,gluc:16.3,lip:0.15,ags:0.042,pot:353,unit:'g'},
    {code:'20030',nom:'Haricots verts',qty:130,kcal:24.9,prot:1.7,gluc:3.3,lip:0.2,ags:0.04,pot:205,unit:'g'},
    {code:'17130',nom:'Huile de colza',qty:10,kcal:900,prot:0,gluc:0,lip:100,ags:7.26,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'d10', meal:'dinner', nom:'Tofu, quinoa & champignons', excludeFor:[], ing:[
    {code:'20904',nom:'Tofu nature',qty:150,kcal:147,prot:13.4,gluc:2.9,lip:8.5,ags:1.35,pot:140,unit:'g'},
    {code:'9341',nom:'Quinoa cuit',qty:130,kcal:149,prot:4.7,gluc:27.9,lip:1.1,ags:0.14,pot:220,unit:'g'},
    {code:'20102',nom:'Champignons de Paris',qty:130,kcal:28.7,prot:2.17,gluc:3,lip:0.47,ags:0.061,pot:356,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'d11', meal:'dinner', nom:'Filet mignon de porc, boulgour & courgette', excludeFor:[], ing:[
    {code:'28203',nom:'Filet mignon de porc',qty:130,kcal:168,prot:26.1,gluc:0,lip:7.1,ags:2.58,pot:344,unit:'g'},
    {code:'9691',nom:'Boulgour cuit',qty:150,kcal:131,prot:4.3,gluc:24.1,lip:1,ags:0.16,pot:67.1,unit:'g'},
    {code:'20021',nom:'Courgette',qty:130,kcal:15.5,prot:0.9,gluc:1.4,lip:0.4,ags:0.1,pot:238,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'d12', meal:'dinner', nom:'Saumon, patate douce & épinards', excludeFor:[], ing:[
    {code:'25996',nom:'Saumon',qty:130,kcal:205,prot:23.2,gluc:0.6,lip:12.2,ags:2.48,pot:383,unit:'g'},
    {code:'4102',nom:'Patate douce cuite',qty:180,kcal:79.1,prot:1.7,gluc:16.3,lip:0.15,ags:0.042,pot:353,unit:'g'},
    {code:'20083',nom:'Épinards',qty:110,kcal:28,prot:3.3,gluc:1,lip:0.5,ags:0.041,pot:346,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'d13', meal:'dinner', nom:'Crevettes, quinoa & brocoli', excludeFor:[], ing:[
    {code:'10006',nom:'Crevettes cuites',qty:150,kcal:89.4,prot:19.4,gluc:0.47,lip:1.1,ags:0.31,pot:97,unit:'g'},
    {code:'9341',nom:'Quinoa cuit',qty:130,kcal:149,prot:4.7,gluc:27.9,lip:1.1,ags:0.14,pot:220,unit:'g'},
    {code:'20057',nom:'Brocoli',qty:130,kcal:31.9,prot:2.9,gluc:2.2,lip:0.4,ags:0.047,pot:321,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'d14', meal:'dinner', nom:'Lentilles, riz complet & poivron', excludeFor:[], ing:[
    {code:'20360',nom:'Lentilles cuites',qty:180,kcal:125,prot:10.1,gluc:16.2,lip:0.57,ags:0.092,pot:215,unit:'g'},
    {code:'9814',nom:'Riz complet cuit',qty:130,kcal:111,prot:2.6,gluc:23,lip:0.9,ags:0.18,pot:79,unit:'g'},
    {code:'20087',nom:'Poivron rouge',qty:110,kcal:33.6,prot:1.1,gluc:6,lip:0.3,ags:0.01,pot:180,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'d15', meal:'dinner', nom:'Haricots blancs, courge butternut & pain complet', excludeFor:[], ing:[
    {code:'20502',nom:'Haricots blancs cuits',qty:180,kcal:112,prot:6.75,gluc:12,lip:1.1,ags:0.25,pot:260,unit:'g'},
    {code:'20292',nom:'Courge butternut',qty:160,kcal:28.9,prot:1.06,gluc:5.24,lip:0.1,ags:0.01,pot:340,unit:'g'},
    {code:'7004',nom:'Pain complet',qty:40,kcal:246,prot:8.8,gluc:41.4,lip:2.7,ags:0.5,pot:230,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'d16', meal:'dinner', nom:'Dinde, riz complet & chou rouge', excludeFor:[], ing:[
    {code:'36320',nom:'Dinde rôtie',qty:130,kcal:142,prot:29.3,gluc:0,lip:2.3,ags:0.6,pot:280,unit:'g'},
    {code:'9814',nom:'Riz complet cuit',qty:150,kcal:111,prot:2.6,gluc:23,lip:0.9,ags:0.18,pot:79,unit:'g'},
    {code:'20310',nom:'Chou rouge cuit',qty:130,kcal:33.9,prot:1.19,gluc:5.7,lip:0.1,ags:0.01,pot:250,unit:'g'},
    {code:'17130',nom:'Huile de colza',qty:10,kcal:900,prot:0,gluc:0,lip:100,ags:7.26,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'d17', meal:'dinner', nom:'Cabillaud, boulgour & betterave', excludeFor:[], ing:[
    {code:'25997',nom:'Cabillaud',qty:150,kcal:100,prot:23.3,gluc:0,lip:0.8,ags:0.17,pot:327,unit:'g'},
    {code:'9691',nom:'Boulgour cuit',qty:150,kcal:131,prot:4.3,gluc:24.1,lip:1,ags:0.16,pot:67.1,unit:'g'},
    {code:'20003',nom:'Betterave cuite',qty:120,kcal:41.5,prot:1.44,gluc:7.13,lip:0.4,ags:0.15,pot:320,unit:'g'},
    {code:'17270',nom:'Huile d\'olive',qty:10,kcal:899,prot:0.25,gluc:0,lip:99.9,ags:15.2,pot:0,unit:'cuillère à soupe',gpu:15}
  ]},
  {id:'s6', meal:'snack', nom:'Faisselle & fraises', excludeFor:[], ing:[
    {code:'19639',nom:'Faisselle 0%',qty:180,kcal:36.8,prot:4.52,gluc:4.65,lip:0.05,ags:0.025,pot:151,unit:'g'},
    {code:'13014',nom:'Fraises',qty:110,kcal:35.1,prot:0.63,gluc:6.03,lip:0.1,ags:0.01,pot:140,unit:'g'}
  ]},
  {id:'s7', meal:'snack', nom:'Houmous, pain de seigle & concombre', excludeFor:[], ing:[
    {code:'25621',nom:'Houmous',qty:45,kcal:258,prot:8.06,gluc:9,lip:19.9,ags:2.02,pot:250,unit:'g'},
    {code:'7125',nom:'Pain de seigle',qty:25,kcal:260,prot:8.27,gluc:51.5,lip:1,ags:0.32,pot:170,unit:'g'},
    {code:'20019',nom:'Concombre',qty:100,kcal:16.8,prot:0.65,gluc:2.87,lip:0.11,ags:0.037,pot:157,unit:'g'}
  ]},
  {id:'s8', meal:'snack', nom:'Fromage blanc & mangue', excludeFor:[], ing:[
    {code:'19501',nom:'Fromage blanc',qty:180,kcal:80,prot:7,gluc:6.3,lip:2.8,ags:1.83,pot:162,unit:'g'},
    {code:'13025',nom:'Mangue',qty:110,kcal:71.1,prot:0.63,gluc:14.3,lip:0.1,ags:0.01,pot:150,unit:'g'}
  ]},
  {id:'s9', meal:'snack', nom:'Pruneaux & noisettes', excludeFor:[], ing:[
    {code:'13042',nom:'Pruneaux',qty:30,kcal:229,prot:1.63,gluc:55.4,lip:0.4,ags:0.16,pot:610,unit:'g'},
    {code:'15004',nom:'Noisettes',qty:15,kcal:632,prot:14.4,gluc:7.16,lip:56.9,ags:4.75,pot:860,unit:'g'}
  ]},
  {id:'s10', meal:'snack', nom:'Yaourt & cerises', excludeFor:[], ing:[
    {code:'19554',nom:'Yaourt nature',qty:150,kcal:66.5,prot:5.6,gluc:3.5,lip:3,ags:2.13,pot:110,unit:'g'},
    {code:'13008',nom:'Cerises',qty:110,kcal:53.7,prot:0.81,gluc:13,lip:0.1,ags:0.01,pot:190,unit:'g'}
  ]},
  {id:'s11', meal:'snack', nom:'Amandes & abricots', excludeFor:[], ing:[
    {code:'15000',nom:'Amandes',qty:15,kcal:615,prot:18.8,gluc:9.5,lip:51.3,ags:4.11,pot:800,unit:'g'},
    {code:'13000',nom:'Abricots',qty:110,kcal:44.1,prot:0.81,gluc:9.01,lip:0.1,ags:0.01,pot:260,unit:'g'}
  ]},
  {id:'s12', meal:'snack', nom:'Faisselle & framboises', excludeFor:[], ing:[
    {code:'19639',nom:'Faisselle 0%',qty:180,kcal:36.8,prot:4.52,gluc:4.65,lip:0.05,ags:0.025,pot:151,unit:'g'},
    {code:'13057',nom:'Framboises',qty:90,kcal:33,prot:1.2,gluc:4.4,lip:0.4,ags:0.02,pot:151,unit:'g'}
  ]},
  {id:'s13', meal:'snack', nom:'Jambon de dinde, concombre & pain de seigle', excludeFor:['hypertension'], ing:[
    {code:'28964',nom:'Jambon de dinde',qty:40,kcal:99.3,prot:20.9,gluc:0,lip:1.67,ags:0.54,pot:370,unit:'g'},
    {code:'20019',nom:'Concombre',qty:100,kcal:16.8,prot:0.65,gluc:2.87,lip:0.11,ags:0.037,pot:157,unit:'g'},
    {code:'7125',nom:'Pain de seigle',qty:30,kcal:260,prot:8.27,gluc:51.5,lip:1,ags:0.32,pot:170,unit:'g'}
  ]},
  {id:'s2_3', meal:'snack2', nom:'Noix de cajou & raisin', excludeFor:[], ing:[
    {code:'15054',nom:'Noix de cajou',qty:15,kcal:618,prot:17.4,gluc:21.3,lip:48.1,ags:8.24,pot:610,unit:'g'},
    {code:'13045',nom:'Raisin',qty:80,kcal:69.5,prot:0.57,gluc:15.6,lip:0.25,ags:0.08,pot:172,unit:'g'}
  ]},
  {id:'s2_4', meal:'snack2', nom:'Fromage blanc & pistaches', excludeFor:[], ing:[
    {code:'19501',nom:'Fromage blanc',qty:150,kcal:80,prot:7,gluc:6.3,lip:2.8,ags:1.83,pot:162,unit:'g'},
    {code:'15044',nom:'Pistaches',qty:15,kcal:631,prot:18.4,gluc:14.9,lip:51.6,ags:6.45,pot:1010,unit:'g'}
  ]},
  {id:'s2_5', meal:'snack2', nom:'Dattes & amandes', excludeFor:[], ing:[
    {code:'13011',nom:'Dattes',qty:30,kcal:287,prot:1.81,gluc:64.7,lip:0.25,ags:0.075,pot:696,unit:'g'},
    {code:'15000',nom:'Amandes',qty:10,kcal:615,prot:18.8,gluc:9.5,lip:51.3,ags:4.11,pot:800,unit:'g'}
  ]},
  {id:'s2_6', meal:'snack2', nom:'Faisselle & ananas', excludeFor:[], ing:[
    {code:'19639',nom:'Faisselle 0%',qty:150,kcal:36.8,prot:4.52,gluc:4.65,lip:0.05,ags:0.025,pot:151,unit:'g'},
    {code:'13002',nom:'Ananas',qty:100,kcal:51.6,prot:0.25,gluc:11.7,lip:0.1,ags:0.01,pot:140,unit:'g'}
  ]},
  {id:'s14', meal:'snack', nom:'Houmous & bâtonnets de légumes', excludeFor:[], ing:[
    {code:'25621',nom:'Houmous',qty:45,kcal:258,prot:8.06,gluc:9,lip:19.9,ags:2.02,pot:250,unit:'g'},
    {code:'20009',nom:'Carotte',qty:90,kcal:30.2,prot:0.78,gluc:5.2,lip:0.3,ags:0.15,pot:274,unit:'g'},
    {code:'20019',nom:'Concombre',qty:90,kcal:16.8,prot:0.65,gluc:2.87,lip:0.11,ags:0.037,pot:157,unit:'g'}
  ]},
  {id:'s15', meal:'snack', nom:'Œuf dur & tomates cerises', excludeFor:[], ing:[
    {code:'22010',nom:'Œuf dur',qty:100,kcal:134,prot:13.5,gluc:0.5,lip:8.6,ags:3.22,pot:120,unit:'g'},
    {code:'20172',nom:'Tomates cerises',qty:100,kcal:31.8,prot:1.31,gluc:5.62,lip:0.1,ags:0.01,pot:330,unit:'g'}
  ]},
  {id:'s16', meal:'snack', nom:'Cracker de seigle & chèvre frais', excludeFor:[], ing:[
    {code:'31063',nom:'Cracker de seigle',qty:25,kcal:297,prot:11.6,gluc:50.4,lip:1.5,ags:0.2,pot:340,unit:'g'},
    {code:'12805',nom:'Fromage de chèvre frais',qty:30,kcal:194,prot:12,gluc:2.5,lip:15.2,ags:10.7,pot:159,unit:'g'}
  ]},
  {id:'s17', meal:'snack', nom:'Galette de riz & houmous', excludeFor:[], ing:[
    {code:'32053',nom:'Galette de riz soufflé',qty:20,kcal:391,prot:7.2,gluc:81.7,lip:2.7,ags:0.9,pot:120,unit:'g'},
    {code:'25621',nom:'Houmous',qty:40,kcal:258,prot:8.06,gluc:9,lip:19.9,ags:2.02,pot:250,unit:'g'}
  ]},
  {id:'s18', meal:'snack', nom:'Thon & concombre', excludeFor:[], ing:[
    {code:'26039',nom:'Thon au naturel',qty:80,kcal:143,prot:26.8,gluc:0,lip:3.94,ags:1.01,pot:207,unit:'g'},
    {code:'20019',nom:'Concombre',qty:100,kcal:16.8,prot:0.65,gluc:2.87,lip:0.11,ags:0.037,pot:157,unit:'g'}
  ]},
  {id:'s19', meal:'snack', nom:'Jambon de dinde & tomates cerises', excludeFor:['hypertension'], ing:[
    {code:'28964',nom:'Jambon de dinde',qty:40,kcal:99.3,prot:20.9,gluc:0,lip:1.67,ags:0.54,pot:370,unit:'g'},
    {code:'20172',nom:'Tomates cerises',qty:90,kcal:31.8,prot:1.31,gluc:5.62,lip:0.1,ags:0.01,pot:330,unit:'g'}
  ]},
  {id:'s20', meal:'snack', nom:'Chocolat noir & amandes', excludeFor:[], ing:[
    {code:'31074',nom:'Chocolat noir 70%',qty:20,kcal:591,prot:10.4,gluc:26.9,lip:46.3,ags:28.7,pot:750,unit:'g'},
    {code:'15000',nom:'Amandes',qty:10,kcal:615,prot:18.8,gluc:9.5,lip:51.3,ags:4.11,pot:800,unit:'g'}
  ]},
  {id:'s21', meal:'snack', nom:'Poivron rouge & houmous', excludeFor:[], ing:[
    {code:'20087',nom:'Poivron rouge',qty:100,kcal:33.6,prot:1.06,gluc:5.98,lip:0.1,ags:0.01,pot:180,unit:'g'},
    {code:'25621',nom:'Houmous',qty:40,kcal:258,prot:8.06,gluc:9,lip:19.9,ags:2.02,pot:250,unit:'g'}
  ]},
  {id:'s22', meal:'snack', nom:'Olives & tomates cerises', excludeFor:['hypertension'], ing:[
    {code:'13186',nom:'Olives noires',qty:30,kcal:182,prot:1.41,gluc:0.26,lip:18,ags:2.17,pot:33.6,unit:'g'},
    {code:'20172',nom:'Tomates cerises',qty:100,kcal:31.8,prot:1.31,gluc:5.62,lip:0.1,ags:0.01,pot:330,unit:'g'}
  ]},
  {id:'s23', meal:'snack', nom:'Radis & fromage de chèvre', excludeFor:[], ing:[
    {code:'20045',nom:'Radis',qty:100,kcal:11,prot:0.94,gluc:1.53,lip:0.1,ags:0.01,pot:250,unit:'g'},
    {code:'12805',nom:'Fromage de chèvre frais',qty:30,kcal:194,prot:12,gluc:2.5,lip:15.2,ags:10.7,pot:159,unit:'g'}
  ]},
  {id:'s2_7', meal:'snack2', nom:'Œuf dur & poivron', excludeFor:[], ing:[
    {code:'22010',nom:'Œuf dur',qty:100,kcal:134,prot:13.5,gluc:0.5,lip:8.6,ags:3.22,pot:120,unit:'g'},
    {code:'20087',nom:'Poivron rouge',qty:80,kcal:33.6,prot:1.06,gluc:5.98,lip:0.1,ags:0.01,pot:180,unit:'g'}
  ]},
  {id:'s2_8', meal:'snack2', nom:'Cracker de seigle & houmous', excludeFor:[], ing:[
    {code:'31063',nom:'Cracker de seigle',qty:25,kcal:297,prot:11.6,gluc:50.4,lip:1.5,ags:0.2,pot:340,unit:'g'},
    {code:'25621',nom:'Houmous',qty:45,kcal:258,prot:8.06,gluc:9,lip:19.9,ags:2.02,pot:250,unit:'g'}
  ]},
  {id:'s2_9', meal:'snack2', nom:'Thon & tomate', excludeFor:[], ing:[
    {code:'26039',nom:'Thon au naturel',qty:80,kcal:143,prot:26.8,gluc:0,lip:3.94,ags:1.01,pot:207,unit:'g'},
    {code:'20066',nom:'Tomate',qty:100,kcal:17.6,prot:0.9,gluc:2.9,lip:0.3,ags:0.02,pot:237,unit:'g'}
  ]},
  {id:'s2_10', meal:'snack2', nom:'Chocolat noir & noisettes', excludeFor:[], ing:[
    {code:'31074',nom:'Chocolat noir 70%',qty:20,kcal:591,prot:10.4,gluc:26.9,lip:46.3,ags:28.7,pot:750,unit:'g'},
    {code:'15004',nom:'Noisettes',qty:10,kcal:632,prot:14.4,gluc:7.16,lip:56.9,ags:4.75,pot:860,unit:'g'}
  ]}
];

var INGREDIENT_CATEGORY_MAP = {
  'Cabillaud':'poisson', 'Colin (lieu jaune)':'poisson', 'Saumon':'poisson',
  'Œuf dur':'oeufs',
  'Steak de bœuf grillé':'viande_rouge',
  'Blanc de poulet':'volaille', 'Dinde rôtie':'volaille',
  'Tofu nature':'tofu',
  'Haricots rouges cuits':'legumineuses', 'Lentilles cuites':'legumineuses', 'Pois chiches cuits':'legumineuses',
  'Yaourt nature':'laitier', 'Fromage blanc':'laitier', 'Lait demi-écrémé':'laitier', 'Beurre':'laitier',
  'Pain blanc':'pain', 'Pain complet':'pain',
  'Riz blanc cuit':'riz', 'Riz complet cuit':'riz',
  'Pâtes complètes cuites':'pates',
  'Quinoa cuit':'cereales', 'Boulgour cuit':'cereales', "Flocons d'avoine":'cereales',
  'Pomme de terre cuite':'pdt', 'Patate douce cuite':'pdt',
  'Brocoli':'legumes_verts', 'Épinards':'legumes_verts', 'Haricots verts':'legumes_verts', 'Courgette':'legumes_verts', 'Chou-fleur':'legumes_verts', 'Salade verte':'legumes_verts',
  'Carotte':'autres_legumes', 'Poivron rouge':'autres_legumes', 'Tomate':'autres_legumes',
  'Banane':'fruits', 'Pomme':'fruits', 'Orange':'fruits', 'Kiwi':'fruits', 'Pêche':'fruits', 'Framboises':'fruits', 'Myrtilles':'fruits',
  'Avocat':'avocat',
  'Amandes':'fruits_coque', 'Noix':'fruits_coque',
  // Huile d'olive / huile de colza volontairement absentes : pas un axe de goût pertinent, toujours autorisées.
  // ── Ajouts Phase 2 (élargissement de la base de recettes) ──
  'Crevettes cuites':'poisson', 'Moules marinières':'poisson', 'Thon au naturel':'poisson', "Sardines à l'huile d'olive":'poisson',
  'Escalope de dinde':'volaille', 'Jambon de dinde':'volaille', 'Lapin cuit':'volaille',
  'Filet mignon de porc':'viande_rouge', "Gigot d'agneau rôti":'viande_rouge',
  'Seitan':'tofu', 'Tempeh':'tofu',
  'Haricots blancs cuits':'legumineuses', 'Houmous':'legumineuses',
  'Petits pois':'autres_legumes', 'Aubergine cuite':'autres_legumes', 'Champignons de Paris':'autres_legumes',
  'Betterave cuite':'autres_legumes', 'Concombre':'autres_legumes', 'Fenouil':'autres_legumes',
  'Céleri branche':'autres_legumes', 'Courge butternut':'autres_legumes',
  'Asperges':'legumes_verts', 'Endives':'legumes_verts', 'Chou rouge cuit':'legumes_verts', 'Galette de sarrasin':'cereales',
  'Mangue':'fruits', 'Ananas':'fruits', 'Fraises':'fruits', 'Cerises':'fruits', 'Abricots':'fruits', 'Raisin':'fruits', 'Pruneaux':'fruits', 'Dattes':'fruits',
  'Noix de cajou':'fruits_coque', 'Noisettes':'fruits_coque', 'Pistaches':'fruits_coque', 'Graines de chia':'fruits_coque', 'Graines de lin':'fruits_coque',
  'Faisselle 0%':'laitier', 'Mozzarella':'laitier', 'Fromage de chèvre frais':'laitier', 'Ricotta':'laitier',
  'Pain aux céréales':'pain', 'Pain de seigle':'pain',
  // ── Ajouts collations salées/variées ──
  'Cracker de seigle':'pain', 'Galette de riz soufflé':'riz',
  'Olives noires':'autres_legumes', 'Radis':'autres_legumes', 'Tomates cerises':'autres_legumes'
  // Chocolat noir 70% volontairement absent : aucune catégorie de goût existante ne lui correspond bien.
};

var COOK_STEPS_BY_ING = {
  'Blanc de poulet': {step:'Faites cuire le blanc de poulet à la poêle avec un filet d\'huile, 6-7 min de chaque côté, jusqu\'à ce qu\'il soit bien doré et cuit à cœur (jus clair, plus aucune trace rosée).', time:15, cat:'protein_cook', active:true},
  'Dinde rôtie': {step:'Faites cuire la dinde à la poêle ou au four jusqu\'à cuisson complète (aucune trace rosée à l\'intérieur).', time:15, cat:'protein_cook', active:true},
  'Escalope de dinde': {step:'Faites cuire l\'escalope de dinde à la poêle, 4-5 min de chaque côté.', time:12, cat:'protein_cook', active:true},
  'Filet mignon de porc': {step:'Faites cuire le filet mignon de porc à la poêle ou au four à 180°C, 15-18 min au total, jusqu\'à ce qu\'il soit bien cuit à cœur.', time:18, cat:'protein_cook', active:true},
  'Gigot d\'agneau rôti': {step:'Faites rôtir le gigot au four à 180°C, environ 20 min par 500g pour une cuisson rosée (ajustez selon la cuisson désirée).', time:25, cat:'protein_cook', active:true},
  'Steak de bœuf grillé': {step:'Faites griller le steak 2-3 min de chaque côté selon la cuisson désirée.', time:8, cat:'protein_cook', active:true},
  'Lapin cuit': {step:'Faites cuire le lapin à la cocotte ou au four à couvert, 35-40 min, jusqu\'à ce que la viande se détache facilement.', time:35, cat:'protein_cook', active:true},
  'Cabillaud': {step:'Faites cuire le cabillaud à la poêle ou au four (180°C), 8-10 min, jusqu\'à ce que la chair devienne opaque et se détache facilement à la fourchette.', time:10, cat:'protein_cook', active:true},
  'Colin (lieu jaune)': {step:'Faites cuire le colin à la poêle ou à la vapeur, 8-10 min.', time:10, cat:'protein_cook', active:true},
  'Saumon': {step:'Faites cuire le saumon à la poêle côté peau 5 min, puis 3-4 min de l\'autre côté (ou au four 15 min à 180°C).', time:10, cat:'protein_cook', active:true},
  'Crevettes cuites': {step:'Faites réchauffer les crevettes 2-3 min à la poêle avec un filet d\'huile, ou servez-les froides.', time:3, cat:'protein_cook', active:false},
  'Œuf dur': {step:'Plongez les œufs dans l\'eau bouillante 9-10 min, refroidissez-les sous l\'eau froide, puis écalez-les.', time:10, cat:'protein_cook', active:true},
  'Tofu nature': {step:'Coupez le tofu en dés et faites-le revenir à la poêle avec un peu d\'huile, 5-6 min, jusqu\'à légère coloration.', time:8, cat:'protein_cook', active:true},
  'Tempeh': {step:'Coupez le tempeh en tranches et faites-le revenir à la poêle, 5 min de chaque côté.', time:10, cat:'protein_cook', active:true},
  'Thon au naturel': {step:'Égouttez le thon et émiettez-le à la fourchette.', time:1, cat:'protein_ready', active:false},
  'Sardines à l\'huile d\'olive': {step:'Égouttez légèrement les sardines.', time:1, cat:'protein_ready', active:false},
  'Jambon de dinde': {step:'Coupez le jambon de dinde en tranches ou en dés.', time:1, cat:'protein_ready', active:false},
  'Houmous': {step:'Tartinez ou servez le houmous directement.', time:1, cat:'protein_ready', active:false},
  'Haricots blancs cuits': {step:'Égouttez et rincez les haricots blancs, réchauffez-les si besoin 2-3 min à la casserole.', time:3, cat:'legume_ready', active:false},
  'Haricots rouges cuits': {step:'Égouttez et rincez les haricots rouges.', time:1, cat:'legume_ready', active:false},
  'Lentilles cuites': {step:'Égouttez les lentilles, réchauffez-les si besoin.', time:2, cat:'legume_ready', active:false},
  'Pois chiches cuits': {step:'Égouttez et rincez les pois chiches.', time:1, cat:'legume_ready', active:false},
  'Petits pois': {step:'Égouttez les petits pois, ou faites-les cuire 3-4 min à l\'eau bouillante s\'ils sont surgelés.', time:4, cat:'legume_ready', active:false},
  'Riz blanc cuit': {step:'Rincez le riz, faites-le cuire dans 2 fois son volume d\'eau bouillante salée, 10-12 min, puis égouttez.', time:12, cat:'starch_cook', active:true},
  'Riz complet cuit': {step:'Rincez le riz complet, faites-le cuire dans 2,5 fois son volume d\'eau, 25-30 min, puis égouttez.', time:28, cat:'starch_cook', active:true},
  'Quinoa cuit': {step:'Rincez le quinoa, faites-le cuire dans 2 fois son volume d\'eau bouillante, 12-15 min, jusqu\'à absorption complète.', time:14, cat:'starch_cook', active:true},
  'Boulgour cuit': {step:'Faites cuire le boulgour dans 1,5 fois son volume d\'eau bouillante, 10-12 min à couvert.', time:12, cat:'starch_cook', active:true},
  'Pâtes complètes cuites': {step:'Faites cuire les pâtes dans un grand volume d\'eau bouillante salée selon le temps indiqué sur le paquet (8-11 min), puis égouttez.', time:10, cat:'starch_cook', active:true},
  'Pomme de terre cuite': {step:'Faites cuire les pommes de terre à l\'eau bouillante ou à la vapeur, 20-25 min, jusqu\'à ce qu\'un couteau s\'y enfonce facilement.', time:22, cat:'starch_cook', active:true},
  'Patate douce cuite': {step:'Faites cuire la patate douce à l\'eau, à la vapeur, ou au four (200°C, 25-30 min), jusqu\'à tendreté.', time:25, cat:'starch_cook', active:true},
  'Pain blanc': {step:'Servez tel quel ou légèrement toasté.', time:1, cat:'bread', active:false},
  'Pain complet': {step:'Servez tel quel ou légèrement toasté.', time:1, cat:'bread', active:false},
  'Pain de seigle': {step:'Servez tel quel ou légèrement toasté.', time:1, cat:'bread', active:false},
  'Pain aux céréales': {step:'Servez tel quel ou légèrement toasté.', time:1, cat:'bread', active:false},
  'Cracker de seigle': {step:'Servez tel quel.', time:1, cat:'bread', active:false},
  'Galette de riz soufflé': {step:'Servez telle quelle.', time:1, cat:'bread', active:false},
  'Brocoli': {step:'Faites cuire le brocoli à la vapeur 5-6 min : il doit rester légèrement croquant.', time:6, cat:'veg_cook', active:true},
  'Épinards': {step:'Faites revenir les épinards à la poêle 2-3 min, jusqu\'à ce qu\'ils tombent.', time:3, cat:'veg_cook', active:true},
  'Haricots verts': {step:'Faites cuire les haricots verts à l\'eau bouillante ou à la vapeur, 8-10 min.', time:9, cat:'veg_cook', active:true},
  'Chou-fleur': {step:'Faites cuire le chou-fleur en petits bouquets à la vapeur, 8-10 min.', time:9, cat:'veg_cook', active:true},
  'Carotte': {step:'Épluchez et coupez la carotte en rondelles, faites-la cuire à la vapeur 10-12 min (ou servez-la crue râpée).', time:10, cat:'veg_cook', active:true},
  'Courgette': {step:'Coupez la courgette en rondelles et faites-la revenir à la poêle avec un filet d\'huile, 6-8 min.', time:7, cat:'veg_cook', active:true},
  'Aubergine cuite': {step:'Coupez l\'aubergine en dés et faites-la cuire à la poêle ou au four, 15-20 min, jusqu\'à tendreté.', time:18, cat:'veg_cook', active:true},
  'Betterave cuite': {step:'Utilisez de la betterave déjà cuite (sous vide), ou faites-la bouillir 40-45 min puis épluchez-la.', time:5, cat:'veg_cook', active:false},
  'Chou rouge cuit': {step:'Émincez le chou rouge et faites-le cuire à l\'étouffée 15-20 min avec un peu d\'eau.', time:18, cat:'veg_cook', active:true},
  'Courge butternut': {step:'Épluchez et coupez la courge en dés, faites-la cuire au four (200°C, 25 min) ou à la vapeur (15 min).', time:20, cat:'veg_cook', active:true},
  'Champignons de Paris': {step:'Émincez les champignons et faites-les revenir à la poêle à feu vif 5-6 min, sans ajouter d\'eau.', time:6, cat:'veg_cook', active:true},
  'Fenouil': {step:'Émincez le fenouil et faites-le revenir à la poêle 8-10 min (ou servez-le cru finement tranché).', time:9, cat:'veg_cook', active:true},
  'Asperges': {step:'Faites cuire les asperges à la vapeur ou à l\'eau bouillante, 6-8 min.', time:7, cat:'veg_cook', active:true},
  'Poivron rouge': {step:'Coupez le poivron en lanières et faites-le revenir à la poêle 5-6 min (ou servez-le cru).', time:6, cat:'veg_cook', active:true},
  'Salade verte': {step:'Lavez et essorez la salade.', time:2, cat:'veg_raw', active:false},
  'Tomate': {step:'Lavez et coupez la tomate en quartiers ou en dés.', time:2, cat:'veg_raw', active:false},
  'Tomates cerises': {step:'Lavez et coupez les tomates cerises en deux.', time:2, cat:'veg_raw', active:false},
  'Concombre': {step:'Lavez et coupez le concombre en rondelles ou en bâtonnets.', time:2, cat:'veg_raw', active:false},
  'Radis': {step:'Lavez et coupez les radis en rondelles.', time:2, cat:'veg_raw', active:false},
  'Avocat': {step:'Coupez l\'avocat en deux, retirez le noyau et détaillez la chair en tranches ou en dés.', time:2, cat:'veg_raw', active:false},
  'Endives': {step:'Lavez les endives et émincez-les.', time:2, cat:'veg_raw', active:false},
  'Pomme': {step:'Lavez et coupez la pomme.', time:1, cat:'fruit_raw', active:false},
  'Banane': {step:'Épluchez et coupez la banane.', time:1, cat:'fruit_raw', active:false},
  'Orange': {step:'Épluchez et détaillez l\'orange en quartiers.', time:2, cat:'fruit_raw', active:false},
  'Kiwi': {step:'Épluchez et coupez le kiwi en tranches.', time:1, cat:'fruit_raw', active:false},
  'Pêche': {step:'Lavez et coupez la pêche en tranches.', time:1, cat:'fruit_raw', active:false},
  'Fraises': {step:'Lavez et équeutez les fraises, coupez-les en deux si besoin.', time:2, cat:'fruit_raw', active:false},
  'Framboises': {step:'Rincez délicatement les framboises.', time:1, cat:'fruit_raw', active:false},
  'Myrtilles': {step:'Rincez les myrtilles.', time:1, cat:'fruit_raw', active:false},
  'Mangue': {step:'Épluchez et coupez la mangue en dés.', time:2, cat:'fruit_raw', active:false},
  'Ananas': {step:'Épluchez et coupez l\'ananas en morceaux.', time:3, cat:'fruit_raw', active:false},
  'Cerises': {step:'Lavez et dénoyautez les cerises.', time:3, cat:'fruit_raw', active:false},
  'Abricots': {step:'Lavez et coupez les abricots en deux, dénoyautez-les.', time:2, cat:'fruit_raw', active:false},
  'Raisin': {step:'Lavez le raisin et détachez les grains.', time:1, cat:'fruit_raw', active:false},
  'Pruneaux': {step:'Servez tels quels, dénoyautés.', time:1, cat:'fruit_dried', active:false},
  'Dattes': {step:'Servez telles quelles, dénoyautées si besoin.', time:1, cat:'fruit_dried', active:false},
  'Yaourt nature': {step:'Servez tel quel, bien frais.', time:1, cat:'dairy', active:false},
  'Fromage blanc': {step:'Servez tel quel, bien frais.', time:1, cat:'dairy', active:false},
  'Faisselle 0%': {step:'Égouttez légèrement si besoin et servez bien frais.', time:1, cat:'dairy', active:false},
  'Fromage de chèvre frais': {step:'Coupez ou émiettez le fromage de chèvre.', time:1, cat:'dairy', active:false},
  'Lait demi-écrémé': {step:'Ajoutez le lait froid ou tiède selon la recette.', time:1, cat:'dairy', active:false},
  'Beurre': {step:'Faites fondre ou ramollir le beurre à température ambiante.', time:1, cat:'dairy', active:false},
  'Amandes': {step:'Servez telles quelles (éventuellement torréfiées à sec 3-4 min à la poêle pour plus de goût).', time:1, cat:'nuts', active:false},
  'Noix': {step:'Servez telles quelles, éventuellement concassées.', time:1, cat:'nuts', active:false},
  'Noisettes': {step:'Servez telles quelles (éventuellement torréfiées à sec 3-4 min à la poêle).', time:1, cat:'nuts', active:false},
  'Pistaches': {step:'Servez-les décortiquées.', time:1, cat:'nuts', active:false},
  'Noix de cajou': {step:'Servez telles quelles.', time:1, cat:'nuts', active:false},
  'Graines de chia': {step:'Mélangez directement dans la préparation, ou laissez gonfler 10 min dans un liquide.', time:1, cat:'nuts', active:false},
  'Graines de lin': {step:'Ajoutez directement (éventuellement moulues pour une meilleure absorption).', time:1, cat:'nuts', active:false},
  'Flocons d\'avoine': {step:'Mélangez avec le liquide (lait, yaourt) et laissez reposer quelques minutes, ou faites cuire 3-4 min en porridge.', time:4, cat:'flakes', active:false},
  'Huile d\'olive': {step:'Utilisez pour la cuisson ou en filet sur le plat fini.', time:0, cat:'oil', active:false},
  'Huile de colza': {step:'Utilisez pour la cuisson ou en assaisonnement.', time:0, cat:'oil', active:false},
  'Olives noires': {step:'Égouttez les olives.', time:1, cat:'other_ready', active:false},
  'Chocolat noir 70%': {step:'Cassez le chocolat en morceaux ou en carrés.', time:1, cat:'other_ready', active:false}
};

// Nombre d'entrées: 90


// ══════════════════════════════════════════════════════════
// GÉNÉRATEUR DE RECETTES — compose automatiquement les étapes de
// préparation, le temps estimé et la difficulté à partir des
// ingrédients d'une recette (RECIPES). Aucune recette n'est écrite
// à la main : ça reste synchronisé avec le plan alimentaire pour
// toujours, y compris pour les recettes ajoutées plus tard.
//
// Ordre de composition :
//   1. Étape(s) "active" par catégorie (protéine, féculent, légume)
//      — celles qui demandent une vraie cuisson.
//   2. Une étape "à préparer également" qui regroupe tout ce qui ne
//      demande pas de cuisson (fruits, laitages, pain, oléagineux...).
//   3. Une étape finale de dressage.
// ══════════════════════════════════════════════════════════

var COOK_CAT_ORDER = ['protein_cook','starch_cook','veg_cook'];
var COOK_CAT_LABEL = {
  protein_cook: '🍳 Protéine', starch_cook: '🍚 Féculent', veg_cook: '🥦 Légume'
};

function buildRecipeSteps(recipe){
  var byCat = {};
  var simple = []; // ingrédients "prêts" ou sans cuisson active
  var activeTimes = [];

  recipe.ing.forEach(function(ing){
    var m = COOK_STEPS_BY_ING[ing.nom];
    if(!m){
      // Filet de sécurité : si un ingrédient n'a pas encore de méthode
      // renseignée (nouvel ajout futur), on l'affiche simplement en
      // préparation libre plutôt que de casser l'affichage.
      simple.push(ing.nom);
      return;
    }
    if(m.active){
      if(!byCat[m.cat]) byCat[m.cat] = [];
      byCat[m.cat].push({nom:ing.nom, step:m.step, time:m.time});
      activeTimes.push(m.time);
    } else {
      simple.push(ing.nom + ' — ' + m.step);
    }
  });

  var steps = [];
  COOK_CAT_ORDER.forEach(function(cat){
    if(!byCat[cat] || !byCat[cat].length) return;
    var label = COOK_CAT_ORDER.length ? (COOK_CAT_LABEL[cat]||'') : '';
    byCat[cat].forEach(function(item){
      steps.push({ title: label + ' — ' + item.nom, content: item.step, timerMin: item.time>=2?item.time:null });
    });
  });

  if(simple.length){
    steps.push({
      title: '🥣 À préparer également',
      content: simple.join('. ') + '.',
      timerMin: null
    });
  }

  steps.push({
    title: '🍽️ Dressage',
    content: 'Répartissez tous les éléments dans l\'assiette (ou le bol), assaisonnez selon vos goûts, et dégustez.',
    timerMin: null
  });

  // Temps total : on part du principe que les cuissons actives se font
  // en parallèle (le riz cuit pendant que le poisson grille) — donc le
  // temps le plus long domine, avec une marge pour la mise en place.
  var prepTime = activeTimes.length ? Math.max.apply(null, activeTimes) + 6 : 5;

  // Difficulté : basée sur le nombre d'étapes de cuisson actives à gérer
  // en même temps, pas sur le nombre total d'ingrédients.
  var activeCount = Object.keys(byCat).reduce(function(n,c){ return n + byCat[c].length; }, 0);
  var difficulty = activeCount <= 1 ? 'Facile' : (activeCount === 2 ? 'Moyen' : 'Un peu plus élaboré');

  return { steps: steps, prepTime: prepTime, difficulty: difficulty };
}
