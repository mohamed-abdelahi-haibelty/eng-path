#!/usr/bin/env node
// Classifies french-words.txt into CEFR levels and distributes across units.
// Run: node scripts/classify-french-vocab.js
// Outputs 8 files in data/: french-vocab-{a1,a2,b1,b2}.json and french-vocab-{a1,a2,b1,b2}-by-unit.json

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const words = [...new Set(
  fs.readFileSync(path.join(DATA_DIR, 'french-words.txt'), 'utf-8')
    .split('\n').map(w => w.trim()).filter(Boolean)
)];

// ─── POS SETS ─────────────────────────────────────────────────────────────────

const PRONOUNS = new Set([
  'je','tu','il','elle','nous','vous','ils','elles',
  'me','te','se','lui','leur','moi','toi','soi','eux',
  'on','ce','celui','cela','ceci','y','en','qui','que','quoi',
  'lequel','laquelle','lesquels','dont','où','quel','quelle',
  'mon','ton','son','notre','votre','mes','tes','ses','nos','vos','leurs',
  'nôtre','vôtre','mien','tien','sien','sienne',
  "elle-même","lui-même","nous-mêmes","moi-même","soi-disant",
  "quelqu'un","quelques-uns",'chacun','aucun','nul',
  'quiconque','autrui',
]);

const PREPOSITIONS = new Set([
  'à','de','en','dans','sur','sous','pour','par','avec','sans',
  'entre','vers','chez','dès','depuis','pendant','durant',
  'avant','après','devant','derrière','contre','près','loin',
  'hors','outre','sauf','malgré','selon','parmi','afin',
  'auprès','envers','autour','jusque','lors',
  "d'après","vis-à-vis","au-delà","au-dessus","au-dessous",
  "c'est-à-dire","d'abord","d'ailleurs","d'autant","grâce",
]);

const CONJUNCTIONS = new Set([
  'et','ou','mais','donc','or','ni','car','si','comme',
  'quand','lorsque','puisque','tandis','cependant','toutefois',
  'néanmoins','pourtant','sinon','aussi','bien','ainsi',
]);

const ADVERB_WORDS = new Set([
  'très','bien','aussi','plus','moins','trop','peu','beaucoup',
  'assez','souvent','toujours','jamais','déjà','encore',
  'maintenant',"aujourd'hui",'hier','demain','là','ici',
  'ailleurs','partout','surtout','notamment','alors','donc',
  'ainsi','parfois',"peut-être",'seulement','environ','presque',
  'vite','bientôt','tôt','tard','longtemps','ensemble','vraiment',
  'sûrement','certainement','probablement','simplement','exactement',
  'complètement','absolument','clairement','directement',
  'immédiatement','finalement','généralement','particulièrement',
  'principalement','rapidement','récemment','régulièrement',
  'totalement','largement','fortement','profondément','facilement',
  'effectivement','précisément','uniquement','justement',
  'suffisamment','naturellement','évidemment','actuellement',
  'correctement','normalement','entièrement','également',
  'pourtant','néanmoins','cependant','toutefois','autrement',
  'certes','voilà','voici','ci','là-bas','là-dessus','là-dedans',
  'ensuite','enfin','bref','quant','non','oui','eh','oh','ah',
  'hein','euh','hélas','davantage','plutôt','même','autant',
  'globalement','essentiellement','pleinement','exclusivement',
  'spécialement','habituellement','traditionnellement',
  'officiellement','personnellement','politiquement',
  'économiquement','socialement','culturellement','techniquement',
  'logiquement','véritablement','réellement','nettement',
  'brutalement','progressivement','partiellement','longuement',
  'ouvertement','franchement','librement','visiblement',
  'apparemment','manifestement','indirectement','sensiblement',
  'considérablement','légèrement','rarement','fréquemment',
  'constamment','continûment','provisoirement','officiellement',
  'conjointement','simultanément','parallèlement','mutuellement',
  'réciproquement','respectivement','collectivement',
  'individuellement','publiquement','privément','enormément',
  'infiniment','suffisamment','tellement','autrement',
  'd\'accord','d\'abord','d\'ailleurs','voici','voilà',
  'ci','quant','bref','certes','là','ici','partout',
  'auparavant','désormais','dorénavant','autrefois','jadis',
  'premièrement','deuxièmement','deuxièmement','euh','hein',
  'quasiment','quasi','pratiquement','vraiment','vraiment',
  'carrément','franchement','résolument','radicalement',
  'fondamentalement','essentiellement','principalement',
  'notamment','surtout','particulièrement','clairement',
  'nettement','véritablement','réellement','effectivement',
  'concrètement','explicitement','littéralement','typiquement',
  'normalement','généralement','habituellement','régulièrement',
  'évidemment','naturellement','logiquement','techniquement',
  'économiquement','politiquement','socialement','culturellement',
]);

const ARTICLES = new Set(['le','la','les','un','une','des','du']);

// ─── POS INFERENCE ────────────────────────────────────────────────────────────

function inferPOS(word) {
  if (ARTICLES.has(word)) return 'other';
  if (PRONOUNS.has(word)) return 'pronoun';
  if (PREPOSITIONS.has(word)) return 'preposition';
  if (CONJUNCTIONS.has(word)) return 'conjunction';
  if (ADVERB_WORDS.has(word)) return 'adverb';

  // Adverbs ending in -ment (length guard avoids short words)
  if (/ment$/.test(word) && word.length > 7) return 'adverb';

  // Verb infinitives
  if (/(?:er|ir|re|oir|ître|aître)$/.test(word) && word.length > 4) return 'verb';

  // Adjectives
  if (/(?:el|ale|aux|eux|euse|if|ive|ique|ant|ante|ent|ente|able|ible|ain|aine|ien|ienne|ois|oise|in|ine|iste|ard)$/.test(word)) return 'adjective';

  // Nouns
  if (/(?:tion|sion|eur|eure|age|ance|ence|ité|isme|iste|teur|trice|esse|ette|eau|ot|ard|ois|ais|ière|ure|ture|oire|aire)$/.test(word)) return 'noun';

  return 'noun';
}

// ─── CEFR LEVEL OVERRIDES ─────────────────────────────────────────────────────

const OVERRIDES = {
  // A1 core verbs
  'être':'A1','avoir':'A1','faire':'A1','aller':'A1','venir':'A1',
  'pouvoir':'A1','vouloir':'A1','devoir':'A1','savoir':'A1','falloir':'A1',
  'voir':'A1','dire':'A1','prendre':'A1','donner':'A1','mettre':'A1',
  'tenir':'A1','rendre':'A1','vivre':'A1','parler':'A1','aimer':'A1',
  'habiter':'A1','travailler':'A1','manger':'A1','boire':'A1','dormir':'A1',
  'arriver':'A1','rester':'A1','trouver':'A1','chercher':'A1',
  'penser':'A1','croire':'A1','connaître':'A1','commencer':'A1',
  'finir':'A1','ouvrir':'A1','fermer':'A1','sortir':'A1','entrer':'A1',
  'tomber':'A1','suivre':'A1','passer':'A1','laisser':'A1',
  'regarder':'A1','écouter':'A1','attendre':'A1','appeler':'A1',
  'jouer':'A1','lire':'A1','écrire':'A1','apprendre':'A1','comprendre':'A1',
  'changer':'A1','gagner':'A1','perdre':'A1','oublier':'A1',
  'aider':'A1','demander':'A1','répondre':'A1','parler':'A1',
  'acheter':'A1','payer':'A1','vendre':'A1',
  'partir':'A1','revenir':'A1','rentrer':'A1',
  // A1 nouns – people/family
  'famille':'A1','enfant':'A1','père':'A1','mère':'A1',
  'frère':'A1','sœur':'A1','ami':'A1','homme':'A1','femme':'A1',
  'garçon':'A1','fille':'A1','maman':'A1','papa':'A1',
  'personne':'A1','gens':'A1','monsieur':'A1','madame':'A1',
  // A1 nouns – time
  'an':'A1','année':'A1','jour':'A1','mois':'A1','semaine':'A1',
  'heure':'A1','minute':'A1','matin':'A1','soir':'A1','nuit':'A1',
  'journée':'A1','soirée':'A1','aujourd\'hui':'A1','hier':'A1','demain':'A1',
  'lundi':'A1','mardi':'A1','mercredi':'A1','jeudi':'A1','vendredi':'A1',
  'samedi':'A1','dimanche':'A1',
  'janvier':'A1','février':'A1','mars':'A1','avril':'A1','mai':'A1',
  'juin':'A1','juillet':'A1','août':'A1','septembre':'A1',
  'octobre':'A1','novembre':'A1','décembre':'A1',
  'printemps':'A1','été':'A1','automne':'A1','hiver':'A1',
  // A1 nouns – place/housing
  'maison':'A1','appartement':'A1','chambre':'A1','salle':'A1',
  'porte':'A1','fenêtre':'A1','rue':'A1','route':'A1','ville':'A1',
  'village':'A1','quartier':'A1','pays':'A1','monde':'A1',
  'école':'A1','bureau':'A1','magasin':'A1','restaurant':'A1',
  'café':'A1','hôtel':'A1','parc':'A1','jardin':'A1','place':'A1',
  'hôpital':'A1','marché':'A1','gare':'A1','aéroport':'A1',
  'table':'A1','chaise':'A1','lit':'A1','porte':'A1',
  // A1 nouns – transport
  'voiture':'A1','train':'A1','avion':'A1','bus':'A1','taxi':'A1',
  'vélo':'A1','métro':'A1','bateau':'A1',
  // A1 nouns – food/drink
  'eau':'A1','pain':'A1','lait':'A1','viande':'A1','poisson':'A1',
  'légume':'A1','fruit':'A1','pomme':'A1','repas':'A1','déjeuner':'A1',
  'dîner':'A1','cuisine':'A1','nourriture':'A1','recette':'A1',
  // A1 nouns – objects/tech
  'téléphone':'A1','ordinateur':'A1','photo':'A1','vidéo':'A1',
  'lettre':'A1','livre':'A1','mot':'A1','page':'A1','carte':'A1',
  'message':'A1','musique':'A1','film':'A1','internet':'A1',
  // A1 nouns – body
  'tête':'A1','main':'A1','bras':'A1','jambe':'A1','pied':'A1',
  'œil':'A1','oreille':'A1','bouche':'A1','nez':'A1','dent':'A1',
  'dos':'A1','corps':'A1','cœur':'A1',
  // A1 nouns – nature/animals
  'soleil':'A1','pluie':'A1','neige':'A1','vent':'A1','ciel':'A1',
  'nuage':'A1','montagne':'A1','mer':'A1','rivière':'A1','lac':'A1',
  'forêt':'A1','arbre':'A1','fleur':'A1','plante':'A1',
  'chien':'A1','chat':'A1','oiseau':'A1','cheval':'A1',
  'mouton':'A1','vache':'A1','poule':'A1','cochon':'A1',
  // A1 nouns – clothing
  'vêtement':'A1','chaussure':'A1','robe':'A1','chemise':'A1',
  'pantalon':'A1','manteau':'A1','chapeau':'A1',
  // A1 adjectives
  'grand':'A1','petit':'A1','bon':'A1','mauvais':'A1','vieux':'A1',
  'jeune':'A1','beau':'A1','nouveau':'A1','premier':'A1','dernier':'A1',
  'seul':'A1','tout':'A1','même':'A1','autre':'A1','certain':'A1',
  'fort':'A1','simple':'A1','long':'A1','haut':'A1','libre':'A1',
  'possible':'A1','difficile':'A1','important':'A1','juste':'A1',
  'vrai':'A1','faux':'A1','propre':'A1','chaud':'A1','froid':'A1',
  'rouge':'A1','blanc':'A1','noir':'A1','vert':'A1','bleu':'A1',
  'jaune':'A1','orange':'A1','rose':'A1','gris':'A1',
  'sûr':'A1','prêt':'A1','ouvert':'A1','fermé':'A1','content':'A1',
  'heureux':'A1','triste':'A1','malade':'A1','fatigué':'A1',
  // A1 numbers
  'deux':'A1','trois':'A1','quatre':'A1','cinq':'A1','six':'A1',
  'sept':'A1','huit':'A1','neuf':'A1','dix':'A1','onze':'A1',
  'douze':'A1','treize':'A1','vingt':'A1','trente':'A1',
  'quarante':'A1','cinquante':'A1','soixante':'A1','cent':'A1','mille':'A1',
  'zéro':'A1',
  // A1 misc nouns
  'travail':'A1','emploi':'A1','argent':'A1','prix':'A1',
  'santé':'A1','médicament':'A1','médecin':'A1',
  'sport':'A1','football':'A1','jeu':'A1',
  'voyage':'A1','vacance':'A1','passeport':'A1','visa':'A1',
  'couleur':'A1','taille':'A1','langue':'A1',
  'classe':'A1','professeur':'A1','étudiant':'A1','élève':'A1',
  'collègue':'A1','patron':'A1','salaire':'A1',
  'argent':'A1','banque':'A1','douleur':'A1',
  'tradition':'A1','fête':'A1','culture':'A1','art':'A1',
  'animal':'A1','nature':'A1','temps':'A1','saison':'A1',
  'logement':'A1','adresse':'A1','meuble':'A1',
  'idée':'A1','raison':'A1','question':'A1','exemple':'A1',
  'vie':'A1','mort':'A1','nom':'A1','prénom':'A1',
  'bonjour':'A1','merci':'A1','pardon':'A1','bonsoir':'A1','salut':'A1',
  'excuser':'A1','rire':'A1','pleurer':'A1','crier':'A1',
  // A2 words that appear early in frequency but are intermediate
  'développement':'A2','situation':'A2','résultat':'A2','programme':'A2',
  'information':'A2','économie':'A2','gouvernement':'A2',
  'société':'A2','relation':'A2','service':'A2','action':'A2',
  'problème':'A2','solution':'A2','décision':'A2','effort':'A2',
  'activité':'A2','position':'A2','réponse':'A2','demande':'A2',
  'objectif':'A2','projet':'A2','plan':'A2','accord':'A2',
  'formation':'A2','mouvement':'A2','communauté':'A2',
  'organisation':'A2','programme':'A2','système':'A2',
  'processus':'A2','réseau':'A2','énergie':'A2','technologie':'A2',
  'environnement':'A2','transport':'A2','commerce':'A2',
  'institution':'A2','association':'A2','partenaire':'A2',
  'production':'A2','consommation':'A2','population':'A2',
  'génération':'A2','participation':'A2','évolution':'A2',
  'croissance':'A2','changement':'A2','amélioration':'A2',
  'recherche':'A2','découverte':'A2','expérience':'A2',
  'connaissance':'A2','éducation':'A2','formation':'A2',
  'santé':'A2','maladie':'A2','traitement':'A2',
  'politique':'A2','élection':'A2','vote':'A2','démocratie':'A2',
  'droit':'A2','liberté':'A2','justice':'A2','loi':'A2',
  'économique':'A2','financier':'A2','budget':'A2','investissement':'A2',
  'marché':'A2','industrie':'A2','entreprise':'A2','emploi':'A2',
  'international':'A2','national':'A2','régional':'A2','local':'A2',
  'social':'A2','culturel':'A2','historique':'A2','scientifique':'A2',
  'médical':'A2','technique':'A2','professionnel':'A2',
  'réussir':'A2','obtenir':'A2','améliorer':'A2','participer':'A2',
  'représenter':'A2','permettre':'A2','utiliser':'A2','créer':'A2',
  'développer':'A2','organiser':'A2','préparer':'A2','proposer':'A2',
  'expliquer':'A2','présenter':'A2','décider':'A2','continuer':'A2',
  'terminer':'A2','établir':'A2','réaliser':'A2','montrer':'A2',
  'annoncer':'A2','informer':'A2','publier':'A2','partager':'A2',
  'visiter':'A2','voyager':'A2','habiter':'A2','loger':'A2',
  'téléphoner':'A2','envoyer':'A2','recevoir':'A2','répondre':'A2',
  'choisir':'A2','accepter':'A2','refuser':'A2','suggérer':'A2',
  'essayer':'A2','réfléchir':'A2','imaginer':'A2','rêver':'A2',
  'rencontrer':'A2','inviter':'A2','remercier':'A2',
  'soigner':'A2','guérir':'A2','blesser':'A2',
  'construire':'A2','produire':'A2','fabriquer':'A2','installer':'A2',
  'acheter':'A2','vendre':'A2','louer':'A2','payer':'A2',
  'économiser':'A2','dépenser':'A2','coûter':'A2',
  'augmenter':'A2','diminuer':'A2','baisser':'A2','hausser':'A2',
  'difficile':'A2','nécessaire':'A2','important':'A2','intéressant':'A2',
  'différent':'A2','nouveau':'A2','moderne':'A2','récent':'A2',
  'rapide':'A2','lent':'A2','court':'A2','profond':'A2',
  'jeunesse':'A2','enfance':'A2','adulte':'A2','âgé':'A2',
  'ami':'A2','amour':'A2','mariage':'A2','amitié':'A2','couple':'A2',
  'quartier':'A2','logement':'A2','appartement':'A2','immeuble':'A2',
  'festival':'A2','concert':'A2','musée':'A2','théâtre':'A2',
  'stade':'A2','match':'A2','champion':'A2','athlète':'A2',
  'télévision':'A2','radio':'A2','journal':'A2','magazine':'A2',
  'photo':'A2','vidéo':'A2','écran':'A2','connexion':'A2',
  'ordinateur':'A2','logiciel':'A2','réseau':'A2','satellite':'A2',
  'électricité':'A2','énergie':'A2','pétrole':'A2','gaz':'A2',
  'pollution':'A2','recyclage':'A2','déchet':'A2','forêt':'A2',
  'océan':'A2','plage':'A2','île':'A2','désert':'A2','jungle':'A2',
  'température':'A2','atmosphère':'A2','solaire':'A2','vent':'A2',
  'alimentation':'A2','aliment':'A2','restaurant':'A2','cuisine':'A2',
  'recette':'A2','ingrédient':'A2','repas':'A2','plat':'A2',
  'chocolat':'A2','café':'A2','thé':'A2','bière':'A2','vin':'A2',
  'fromage':'A2','soupe':'A2','beurre':'A2','huile':'A2','sucre':'A2',
  'sel':'A2','grain':'A2','blé':'A2','riz':'A2','céréale':'A2',
  'université':'A2','lycée':'A2','collège':'A2','diplôme':'A2',
  'bibliothèque':'A2','cahier':'A2','dictionnaire':'A2',
  'accident':'A2','crime':'A2','prison':'A2','police':'A2',
  'armée':'A2','soldat':'A2','guerre':'A2','paix':'A2',
  'héritage':'A2','patrimoine':'A2','religion':'A2','église':'A2',
  'saint':'A2','prière':'A2','foi':'A2',
  'costume':'A2','uniforme':'A2','mode':'A2','style':'A2',
  'beauté':'A2','coiffure':'A2',
  'basket':'A2','natation':'A2','tennis':'A2','ski':'A2','golf':'A2',
  'entraîneur':'A2','équipe':'A2','championnat':'A2',
  'médicament':'A2','allergie':'A2','symptôme':'A2','vaccin':'A2',
  'psychologie':'A2','stress':'A2','dépression':'A2','thérapie':'A2',
  'bonheur':'A2','joie':'A2','tristesse':'A2','colère':'A2',
  'peur':'A2','espoir':'A2','confiance':'A2','courage':'A2',
  'talent':'A2','ambition':'A2','rêve':'A2','désir':'A2',
  'immigration':'A2','réfugier':'A2','frontière':'A2','passeport':'A2',
  'tourisme':'A2','monument':'A2','patrimoine':'A2','musée':'A2',
  'publicité':'A2','marque':'A2','client':'A2','consommateur':'A2',
  'startup':'A2','entrepreneur':'A2','innovation':'A2',
};

// ─── CEFR LEVEL CLASSIFICATION ───────────────────────────────────────────────

function classifyLevel(word, index, total) {
  if (OVERRIDES[word]) return OVERRIDES[word];

  // Pure grammatical function words: A1 if top half, A2 otherwise
  if (PRONOUNS.has(word) || PREPOSITIONS.has(word) || CONJUNCTIONS.has(word) || ARTICLES.has(word)) {
    return index / total < 0.5 ? 'A1' : 'A2';
  }
  if (ADVERB_WORDS.has(word)) {
    const r = index / total;
    if (r < 0.3) return 'A1';
    if (r < 0.55) return 'A2';
    return 'B1';
  }

  // Adverbs ending in -ment
  if (/ment$/.test(word) && word.length > 7) {
    const r = index / total;
    if (r < 0.35) return 'A2';
    if (r < 0.65) return 'B1';
    return 'B2';
  }

  // Content words: frequency-based with adjustment
  const r = index / total;
  if (r < 0.20) return 'A1';
  if (r < 0.42) return 'A2';
  if (r < 0.65) return 'B1';
  return 'B2';
}

// ─── UNIT KEYWORD MAPS ───────────────────────────────────────────────────────
// Each unit has a set of signal words — higher overlap = higher affinity score.

const UNIT_KEYWORDS = {
  A1: {
    'unit-01': new Set(['matin','lever','coucher','heure','jour','routine','toujours','souvent','jamais','réveil','déjeuner','dîner','quotidien','habitude','temps','schedule','mardi','lundi','semaine','agenda','debout']),
    'unit-02': new Set(['famille','père','mère','frère','sœur','enfant','parent','grand-père','grand-mère','fils','fille','mariage','mari','époux','cousin','oncle','tante','familial','parenté','ménage']),
    'unit-03': new Set(['manger','boire','nourriture','aliment','repas','santé','pain','lait','viande','poisson','légume','fruit','pomme','alimentation','nutrition','régime','goûter','faim','soif','nourrir']),
    'unit-04': new Set(['ville','village','rue','quartier','bâtiment','immeuble','mairie','place','centre','urbain','rural','région','commune','habitat','logement','voisin','espace']),
    'unit-05': new Set(['travail','emploi','métier','bureau','patron','collègue','salaire','profession','poste','chef','directeur','secrétaire','fonctionnaire','médecin','ingénieur','avocat','infirmier','professeur','métier']),
    'unit-06': new Set(['sport','football','vélo','jouer','équipe','match','course','exercice','corps','bras','jambe','entraîner','stade','champion','compétition','athlète','natation','tennis','ski','basket']),
    'unit-07': new Set(['voyage','train','avion','bus','taxi','voiture','route','pays','carte','passeport','vacance','touriste','visiter','partir','destination','gare','aéroport','billet','hôtel','excursion']),
    'unit-08': new Set(['téléphone','ordinateur','internet','message','photo','vidéo','écran','réseau','connexion','mail','application','numérique','technologie','appareil','logiciel','portable','tablette','site','web']),
    'unit-09': new Set(['école','classe','professeur','étudiant','élève','apprendre','étude','université','lycée','leçon','cours','examen','cahier','stylo','bibliothèque','diplôme','éducation','instruction','devoirs']),
    'unit-10': new Set(['argent','prix','payer','acheter','vendre','banque','économie','monnaie','billet','coin','euro','dollar','dépenser','coûter','budget','salaire','revenu','transaction','facture']),
    'unit-11': new Set(['arbre','fleur','forêt','montagne','mer','rivière','lac','animal','nature','plante','oiseau','chien','chat','monde','terre','sol','herbe','bois','pierre','océan']),
    'unit-12': new Set(['soleil','pluie','neige','vent','nuage','ciel','chaud','froid','climat','météo','saison','température','temps','orage','brouillard','grêle','printemps','été','automne','hiver']),
    'unit-13': new Set(['médecin','hôpital','malade','médicament','douleur','santé','maladie','symptôme','guérir','soigner','infirmier','pharmacie','urgence','opération','traitement','corps','fièvre','allergie','dent']),
    'unit-14': new Set(['ami','amour','famille','relation','mariage','rencontrer','aimer','couple','sentiment','amitié','cœur','tendresse','confiance','respect','jalousie','rupture','bonheur','partager','soutien']),
    'unit-15': new Set(['maison','appartement','chambre','porte','fenêtre','lit','table','chaise','meuble','logement','salle','cuisine','salon','jardin','balcon','toit','mur','escalier','sol','plafond']),
    'unit-16': new Set(['magasin','acheter','vêtement','chaussure','couleur','taille','marché','boutique','shopping','robe','chemise','pantalon','manteau','chapeau','mode','soldes','caisse','panier','sac']),
    'unit-17': new Set(['musique','chanson','chanter','concert','instrument','écouter','son','radio','guitare','piano','rythme','album','disque','artiste','chanteur','spectacle','orchestre']),
    'unit-18': new Set(['livre','lire','film','télévision','écran','vidéo','histoire','auteur','journal','roman','magazine','texte','lecture','page','chapitre','bibliothèque','librairie','série','émission']),
    'unit-19': new Set(['chien','chat','oiseau','animal','poisson','cheval','mouton','vache','cochon','poule','lapin','éléphant','lion','tigre','singe','sauvage','domestique','compagnie','vétérinaire','cage']),
    'unit-20': new Set(['voiture','train','avion','bus','taxi','métro','route','gare','aéroport','conduire','transporter','véhicule','camion','moto','circulation','trafic','trajet','ligne','direction','station']),
    'unit-21': new Set(['célèbre','histoire','personnage','héros','roi','reine','président','modèle','légende','monument','gloire','admirer','médaille','récompense','victoire','biographie','portrait','star','vedette']),
    'unit-22': new Set(['tradition','fête','culture','célébrer','coutume','patrimoine','costume','carnaval','noël','pâques','anniversaire','cérémonie','rite','hommage','commémorer','drapeau','hymne','religion','saint']),
    'unit-23': new Set(['art','dessiner','peindre','couleur','créer','artiste','musée','peinture','sculpture','dessin','tableau','galerie','exposition','créativité','imagination','crayon','pinceau','chef-d\'œuvre']),
    'unit-24': new Set(['aider','donner','communauté','bénévole','ensemble','solidarité','partager','soutien','entraide','association','don','charité','générosité','service','volontaire','mission']),
    'unit-25': new Set(['dormir','lit','nuit','repos','sommeil','fatiguer','calme','rêve','réveil','sieste','détendre','relaxer','fatigue','épuiser','reposer','tranquille','silence','paix','oreiller']),
    'unit-26': new Set(['cuisine','recette','cuire','repas','plat','restaurant','goût','nourriture','épice','sauce','ingrédient','cuisinier','feu','four','casserole','soupe','gâteau','dessert','apéritif','menu']),
    'unit-27': new Set(['langue','parler','mot','apprendre','comprendre','pratiquer','dictionnaire','grammaire','vocabulaire','accent','traduire','bilingue','étranger','communication','expression','phrase']),
    'unit-28': new Set(['internet','ordinateur','message','réseau','connexion','téléphone','site','ligne','email','application','télécharger','cliquer','logiciel','moteur','recherche','forum','compte','profil','web']),
    'unit-29': new Set(['environnement','nature','propre','planète','arbre','recyclage','déchet','pollution','écologie','vert','forêt','animal','eau','sol','air','durable','écoresponsable','protéger','réduire']),
    'unit-30': new Set(['objectif','réussir','avenir','but','rêve','effort','succès','ambition','projet','futur','espoir','motivation','persévérance','talent','développer','atteindre','progresser','détermination']),
  },

  A2: {
    'unit-01': new Set(['sommeil','cerveau','corps','repos','santé','mélatonine','rythme','cycle','bilan','récupération','nuit','phase','biologique','qualité','durée','insomnie','sieste','horaire','éveil','fatigue']),
    'unit-02': new Set(['ferme','agriculture','production','aliment','paysan','récolte','culture','sol','animal','blé','légume','fruit','tracteur','semence','élevage','bio','chaîne','approvisionnement','nourriture','pêche']),
    'unit-03': new Set(['enfance','culture','identité','grandir','famille','tradition','différence','adaptation','communauté','génération','éducation','langue','origine','pays','habitude','valeur','coutume','intégration']),
    'unit-04': new Set(['argent','histoire','monnaie','économie','commerce','échange','valeur','marché','prix','billet','pièce','banque','or','troc','dette','crédit','inflation','richesse','pauvreté','transaction']),
    'unit-05': new Set(['invention','technologie','découverte','science','histoire','progrès','industriel','machine','ingénieur','brevet','révolution','innover','avance','imprimerie','électricité','vapeur','moteur','rail','ordinateur']),
    'unit-06': new Set(['eau','ressource','environnement','rivière','océan','pluie','réservoir','planète','purification','accès','précieux','manque','sécheresse','gestion','fleuve','nappe','irrigation','polluant','recyclage']),
    'unit-07': new Set(['ville','croissance','population','urbanisation','logement','infrastructure','quartier','migration','banlieue','métropole','transport','densité','aménagement','développement','planification','immobilier']),
    'unit-08': new Set(['femme','genre','égalité','droit','société','rôle','travail','éducation','discrimination','féminisme','pouvoir','politique','leader','indépendance','inégalité','maternité','parité','émancipation']),
    'unit-09': new Set(['immigration','migrant','pays','raison','travail','famille','réfugié','frontière','intégration','communauté','culture','langue','adaptation','discrimination','identité','politique','visa','asile','accueil']),
    'unit-10': new Set(['réseau','social','jeune','influence','internet','numérique','partage','communauté','image','publicité','ami','profil','contenu','engagement','tendance','viral','addiction','smartphone','connexion','plateforme']),
    'unit-11': new Set(['sport','compétition','athlète','médaille','équipe','champion','entraînement','jeux','performance','record','victoire','stade','nation','olympique','arbitre','discipline','natation','marathon','podium']),
    'unit-12': new Set(['climat','température','gaz','émission','atmosphère','réchauffement','effet','planète','énergie','carbonne','glaciaire','sécheresse','inondation','catastrophe','durable','pollution','réduire','renouvelable']),
    'unit-13': new Set(['achat','ligne','livraison','consommateur','prix','boutique','marque','tendance','panier','commande','retour','client','paiement','carte','application','magasin','promotion','solde','comparaison','avis']),
    'unit-14': new Set(['santé','mental','émotion','stress','anxiété','dépression','thérapie','bien-être','psychologie','équilibre','bonheur','soutien','attitude','positif','négatif','conscience','relaxation','méditation','burnout']),
    'unit-15': new Set(['espace','planète','fusée','astronaute','satellite','galaxie','étoile','lune','soleil','exploration','gravité','orbite','mission','univers','cosmos','capsule','laboratoire','station','science','technologie']),
    'unit-16': new Set(['animal','espèce','disparition','habitat','biodiversité','protection','environnement','forêt','menace','extinction','chasse','braconnage','réserve','écosystème','conservation','faune','flore','île','sauvage']),
    'unit-17': new Set(['éducation','école','système','enseigner','accès','élève','apprendre','qualité','diplôme','inégalité','professeur','programme','université','formation','alphabétisation','numérique','rural','gouvernement','financement']),
    'unit-18': new Set(['publicité','influence','marque','consommateur','média','image','message','cible','vente','achat','attention','persuasion','technique','campagne','réseau','stratégie','budget','cliché','manipulation','impact']),
    'unit-19': new Set(['démocratie','vote','élection','gouvernement','droit','citoyen','parti','candidat','assemblée','parlement','politique','constitution','referendum','liberté','transparence','participation','scrutin','mandat']),
    'unit-20': new Set(['énergie','renouvelable','solaire','éolienne','hydro','nucléaire','pétrole','gaz','charbon','émission','environnement','transition','production','installation','réseau','stockage','investissement','économie']),
    'unit-21': new Set(['mode','vêtement','industrie','production','consommation','tendance','usine','travailleur','coton','textile','recyclage','fast','impact','environnement','éthique','marque','défilé','collection','matière']),
    'unit-22': new Set(['santé','vaccin','maladie','prévention','épidémie','immunité','virus','bactérie','hôpital','médecin','vaccination','population','protection','risque','système','programme','campagne','efficacité','côté']),
    'unit-23': new Set(['numérique','accès','technologie','internet','inégalité','fracture','rural','urbain','éducation','ordinateur','compétence','formation','réseau','alphabétisation','inclusion','pauvreté','infrastructure']),
    'unit-24': new Set(['bénévole','aide','international','solidarité','organisation','association','don','humanitaire','développement','projet','communauté','volontaire','engagement','mission','terrain','crise','urgence','coopération']),
    'unit-25': new Set(['droits','liberté','histoire','humain','égalité','dignité','justice','lutte','mouvement','esclavage','colonial','discrimination','convention','loi','international','organisation','traité','protestation','révolution']),
    'unit-26': new Set(['nourriture','sécurité','alimentation','faim','pauvreté','production','distribution','accès','gaspillage','récolte','aide','crise','population','malnutrition','agriculture','logistique','ressource','chaîne']),
    'unit-27': new Set(['bonheur','psychologie','bien-être','émotion','positif','satisfaction','relation','sens','gratitude','résilience','succès','objectif','mindfulness','épanouissement','attitude','optimisme','mental']),
    'unit-28': new Set(['intelligence','artificielle','algorithme','donnée','apprentissage','machine','robot','automatisation','technologie','calcul','programme','réseau','traitement','modèle','système','futur','éthique','application']),
    'unit-29': new Set(['patrimoine','culture','tourisme','monument','histoire','tradition','site','musée','artisanat','architecture','héritage','conservation','visite','protection','authenticité','communauté','développement']),
    'unit-30': new Set(['travail','futur','automatisation','emploi','compétence','formation','économie','technologie','télétravail','flexibilité','robot','marché','innovation','transformation','numérique','carrière','secteur','revenu']),
  },

  B1: {
    'unit-01': new Set(['motivation','psychologie','objectif','récompense','intrinsèque','extrinsèque','effort','défi','autodiscipline','comportement','habitude','procrastination','succès','accomplissement','besoin','identité','but']),
    'unit-02': new Set(['plateforme','numérique','économie','travail','revenus','Airbnb','Uber','gig','indépendant','freelance','algorithme','régulation','monopole','taxation','service','disruption','marché']),
    'unit-03': new Set(['urbanisation','inégalité','pauvreté','logement','ségrégation','migration','accès','service','infrastructure','développement','gentrification','bidonville','exclusion','mobilité','espace','ville']),
    'unit-04': new Set(['médias','information','critique','désinformation','source','vérification','fake','manipulation','algorithme','bulle','filtre','biais','analyse','contenu','réseau','influence','littératie','éducation']),
    'unit-05': new Set(['mémoire','cerveau','apprentissage','consolidation','souvenir','encodage','récupération','oubli','attention','concentration','stress','sommeil','émotion','stratégie','cognitif','mnémotechnique','répétition']),
    'unit-06': new Set(['océan','pollution','plastique','déchets','marine','corail','écosystème','acidification','pêche','microplastique','navigation','récif','espèce','disparition','protection','biodiversité','continent','courant']),
    'unit-07': new Set(['zoo','animal','captivité','conservation','éthique','bien-être','naturel','habitat','reproduction','espèce','sauvage','sanctuaire','tourisme','éducation','menacé','comportement','souffrance']),
    'unit-08': new Set(['revenu','inégalité','richesse','distribution','pauvreté','classe','mobilité','fiscalité','salaire','capital','mondialisation','héritage','redistribution','impôt','écart','croissance','travail']),
    'unit-09': new Set(['réseau','politique','influence','désinformation','polarisation','opinion','algorithm','bulles','propagande','campagne','engagement','partage','manipulation','élection','démocratie','discours','mobilisation']),
    'unit-10': new Set(['alimentation','industrie','production','chaîne','mondialisation','agriculture','pesticide','OGM','transformation','emballage','distribution','sécurité','traçabilité','label','gaspillage','exportation']),
    'unit-11': new Set(['colonialisme','histoire','empire','pouvoir','domination','indépendance','exploitation','résistance','décolonisation','héritage','Africa','Asie','esclavage','commerce','territoire','administration']),
    'unit-12': new Set(['addiction','technologie','écran','comportement','dépendance','cerveau','dopamine','réseau','usage','habitude','numérique','jeune','santé','détox','contrôle','anxiété','isolement','bien-être']),
    'unit-13': new Set(['revenu','universel','base','société','pauvreté','travail','automatisation','redistribution','économie','expérimentation','financement','inégalité','dignité','participation','citoyenneté']),
    'unit-14': new Set(['éducation','système','échec','inégalité','réforme','accès','qualité','élève','sélection','compétence','décrochage','financement','programme','numérique','enseignant','évaluation','insertion']),
    'unit-15': new Set(['nationalisme','identité','frontière','immigration','politique','populisme','souveraineté','minorité','culture','discrimination','xénophobie','Union','Europe','mondialisation','appartenance']),
    'unit-16': new Set(['justice','prison','réhabilitation','criminalité','punition','récidive','peine','détenu','système','droit','victime','accusé','tribunal','liberté','programme','insertion','police','prévention']),
    'unit-17': new Set(['climatique','CO2','réchauffement','carbone','émission','fossile','énergie','gaz','atmosphère','glacial','sécheresse','océan','renouvelable','adaptation','atténuation','accord','protocole']),
    'unit-18': new Set(['genre','rôle','société','stéréotype','égalité','discrimination','identité','féminisme','masculin','féminin','parentalité','professionnel','inégalité','norme','culture','changement','représentation']),
    'unit-19': new Set(['entreprise','monopole','pouvoir','marché','concurrence','régulation','multinationale','fiscalité','lobbying','consommateur','emploi','fusion','domination','GAFA','antitrust']),
    'unit-20': new Set(['réfugié','crise','déplacement','frontière','asile','droit','humanitaire','migration','camp','intégration','conflit','guerre','accueil','persécution','statut','ONU','politique']),
    'unit-21': new Set(['nutrition','alimentation','santé','régime','équilibre','protéine','vitamine','graisse','sucre','fibre','microbiote','obésité','diabète','prévention','étude','scientifique','impact']),
    'unit-22': new Set(['cybercriminalité','sécurité','hacker','fraude','phishing','données','protection','virus','piratage','identité','réseau','chiffrement','vulnérabilité','attaque','numérique','entreprise']),
    'unit-23': new Set(['religion','société','croyance','foi','pratique','identité','laïcité','conflit','tolérance','extrémisme','spiritualité','communauté','rituel','institution','diversité','sécularisation']),
    'unit-24': new Set(['biodiversité','écosystème','espèce','habitats','extinction','menace','forêt','océan','pollinisateur','chaîne','alimentaire','conservation','protection','sauvage','équilibre','faune','flore']),
    'unit-25': new Set(['désinformation','fake','news','médias','vérification','source','algorithme','propagande','complots','crédibilité','journaliste','réseau','bulle','manipulation','opinion','confiance','information']),
    'unit-26': new Set(['espace','satellite','commercial','économie','entreprise','lance','orbite','tourisme','exploitation','asteroid','ressource','investissement','régulation','télécommunication','GPS','données']),
    'unit-27': new Set(['langue','minorité','préservation','culture','identité','menacée','disparition','revitalisation','politique','éducation','communauté','dialecte','tradition','patrimoine','bilinguisme','documentation']),
    'unit-28': new Set(['génétique','éthique','ADN','modification','CRISPR','maladie','traitement','eugénisme','clonage','recherche','scientifique','réglementation','consentement','risque','impact','biotechnologie']),
    'unit-29': new Set(['drogue','politique','réforme','santé','dépendance','légalisation','décriminalisation','traitement','addiction','trafic','criminalité','prévention','harm','reduction','société']),
    'unit-30': new Set(['démocratie','institution','pression','populisme','corruption','pouvoir','opposition','liberté','presse','élection','manipulation','confiance','résistance','réforme','civile','participation']),
  },

  B2: {
    'unit-01': new Set(['comportemental','économie','biais','rationnel','décision','nudge','heuristique','ancrage','aversion','perte','prospect','théorie','marché','consommateur','expérimental','incitation','choix','cadrage']),
    'unit-02': new Set(['attention','économie','engagement','numérique','plateforme','algorithme','temps','captation','publicité','distraction','cognitif','médias','manipulation','ressource','humaine','concentration','addiction']),
    'unit-03': new Set(['traumatisme','croissance','résilience','post-traumatique','psychologie','adversité','transformation','développement','personnel','coping','sens','identité','guérison','adaptation','philosophie']),
    'unit-04': new Set(['démocratie','avenir','institution','libérale','populisme','autoritarisme','gouvernance','participation','délibération','crise','confiance','réforme','citoyen','pluralisme','accountability']),
    'unit-05': new Set(['neuroscience','apprentissage','cerveau','mémoire','plasticité','synapse','cognitif','émotion','attention','consolidation','sommeil','neurologie','pédagogie','mécanisme','encodage']),
    'unit-06': new Set(['surveillance','éthique','état','vie','privée','technologie','données','citoyen','CCTV','biométrique','algorithme','transparence','Orwell','liberté','résistance','régulation','société']),
    'unit-07': new Set(['capitalisme','histoire','Marx','bourgeoisie','prolétariat','exploitation','accumulation','crise','révolution','industrielle','marché','valeur','travail','classe','féodalisme','impérialisme']),
    'unit-08': new Set(['vie','privée','numérique','données','droits','RGPD','consentement','surveillance','traçabilité','profilage','protection','cryptographie','anonymat','régulation','législation']),
    'unit-09': new Set(['philosophie','bonheur','vertu','épicurisme','stoïcisme','hédonisme','eudémonisme','Aristote','sens','épanouissement','éthique','contemplation','subjectif','objectif','sagesse']),
    'unit-10': new Set(['chaîne','approvisionnement','mondiale','logistique','distribution','risque','résilience','délocalisation','multinationale','transport','stockage','gestion','flux','disruption','automatisation']),
    'unit-11': new Set(['préjugé','biais','discrimination','psychologie','cognition','implicite','stéréotype','racisme','sexisme','comportement','inconscient','formation','diversité','inclusion','intervention']),
    'unit-12': new Set(['antibiotique','résistance','bactérie','médicament','superbactérie','santé','mondiale','prescription','vétérinaire','agriculture','mutation','transmission','épidémie','OMS','protocole']),
    'unit-13': new Set(['enseignement','supérieur','avenir','université','dette','diplôme','marché','travail','accès','sélection','financement','modèle','numérique','compétences','réforme','internationalisation']),
    'unit-14': new Set(['géopolitique','puissance','mondiale','relations','internationales','alliance','conflit','diplomatie','territoire','ressource','influence','hégémonie','multipolaire','OTAN','stratégique']),
    'unit-15': new Set(['addiction','neuroscience','dopamine','récompense','dépendance','cerveau','traitement','comportement','cognitif','vulnérabilité','rechute','thérapie','pharmacologique','prévention','mécanisme']),
    'unit-16': new Set(['développement','durable','soutenabilité','environnement','économie','social','équité','circulaire','biodiversité','carbone','neutralité','transition','ESG','gouvernance','rapportage']),
    'unit-17': new Set(['algorithme','biais','intelligence','artificielle','données','discrimination','équité','opacité','décision','réglementation','accountability','transparence','fairness','impact','automatisation']),
    'unit-18': new Set(['richesse','éthique','inégalité','redistribution','philanthropie','héritage','fiscalité','obligation','luxe','responsabilité','pouvoir','morale','justice','sociale','fortune']),
    'unit-19': new Set(['nucléaire','énergie','débat','risque','sécurité','déchets','radioactif','puissance','transition','Fukushima','Tchernobyl','carbone','renouvelable','décarbonation','coût','fiabilité']),
    'unit-20': new Set(['migration','humaine','histoire','diaspora','identité','intégration','politique','accueil','frontière','mondialisation','réfugié','économique','crise','sécurité','xénophobie','transnationale']),
    'unit-21': new Set(['philosophie','éducation','finalité','Rousseau','Dewey','Freire','pédagogie','critique','émancipation','citoyenneté','autonomie','réforme','transmission','savoir','communauté']),
    'unit-22': new Set(['biais','cognitif','heuristique','décision','raisonnement','confirmation','ancrage','disponibilité','illusion','métacognition','réflexion','Kahneman','psychologie','comportement','erreur']),
    'unit-23': new Set(['viande','éthique','consommation','animal','environnement','souffrance','végétarisme','véganisme','industrie','élevage','bien-être','droits','culturel','alimentation','impact','carbone']),
    'unit-24': new Set(['impérialisme','culturel','mondialisation','identité','domination','langue','Hollywood','soft','power','résistance','hybridité','postcolonial','authenticité','tradition','médias']),
    'unit-25': new Set(['contrat','social','Rousseau','Locke','Hobbes','Rawls','légitimité','état','société','liberté','consentement','démocratie','obligation','droit','coopération','philosophie']),
    'unit-26': new Set(['dark','pattern','interface','manipulation','utilisateur','design','tromperie','consentement','éthique','addiction','psychologie','régulation','transparence','comportement','numérique']),
    'unit-27': new Set(['santé','mondiale','gouvernance','OMS','pandémie','équité','vaccin','accès','système','politique','financement','réponse','coopération','traité','souveraineté','solidarité']),
    'unit-28': new Set(['art','société','rôle','expression','identité','politique','résistance','culture','esthétique','subversion','institution','marché','financement','patrimoine','démocratisation','censure']),
    'unit-29': new Set(['décroissance','économie','soutenabilité','PIB','consommation','bien-être','Serge','Latouche','convivialité','sobriété','degrowth','capitalisme','alternative','réduction','post']),
    'unit-30': new Set(['mémoire','histoire','éthique','responsabilité','commémoration','réconciliation','vérité','trauma','oubli','révisionnisme','témoignage','justice','transitionnelle','archives','devoir']),
  },
};

// ─── UNIT ASSIGNMENT ──────────────────────────────────────────────────────────

function assignToUnits(levelWords, unitKeywords) {
  const unitKeys = Object.keys(unitKeywords); // unit-01 … unit-30
  const TARGET = Math.floor(levelWords.length / unitKeys.length);
  const MIN = 33;
  const MAX = 37;

  const assigned = {};
  for (const u of unitKeys) assigned[u] = [];
  const usedWords = new Set();

  // Pass 1: assign only words that have a clear semantic match (score > 0)
  for (const word of levelWords) {
    let bestUnit = null;
    let bestScore = 0; // must exceed 0 to assign in this pass

    for (const u of unitKeys) {
      if (assigned[u].length >= MAX) continue;
      let score = 0;
      if (unitKeywords[u].has(word)) {
        score = 2;
      } else if (word.length > 4) {
        const stem = word.slice(0, 5);
        for (const kw of unitKeywords[u]) {
          if (kw.startsWith(stem) || word.startsWith(kw.slice(0, 5))) { score = 1; break; }
        }
      }
      if (score > bestScore) { bestScore = score; bestUnit = u; }
    }

    if (bestUnit && bestScore > 0) {
      assigned[bestUnit].push(word);
      usedWords.add(word);
    }
  }

  // Clamp units that exceeded MAX by moving excess to a pool
  const pool = [];
  for (const u of unitKeys) {
    while (assigned[u].length > MAX) pool.push(assigned[u].pop());
  }

  // Pass 2: distribute remaining unmatched words evenly across units that need more
  const unmatched = levelWords.filter(w => !usedWords.has(w));
  const allExtra = [...pool, ...unmatched];

  // Round-robin fill: iterate units repeatedly until all extras are placed
  let ei = 0;
  let safetyLimit = allExtra.length * unitKeys.length + 1;
  let iterations = 0;
  while (ei < allExtra.length && iterations < safetyLimit) {
    iterations++;
    let placed = false;
    for (const u of unitKeys) {
      if (ei >= allExtra.length) break;
      if (assigned[u].length < MAX) {
        assigned[u].push(allExtra[ei++]);
        placed = true;
      }
    }
    if (!placed) break; // all units at MAX, stop
  }

  // Pass 3: if any unit still under MIN, steal from the largest unit
  for (let attempt = 0; attempt < 100; attempt++) {
    const under = unitKeys.filter(u => assigned[u].length < MIN);
    if (under.length === 0) break;
    const over = [...unitKeys].sort((a, b) => assigned[b].length - assigned[a].length);
    for (const u of under) {
      for (const donor of over) {
        if (assigned[donor].length > MIN && donor !== u) {
          assigned[u].push(assigned[donor].pop());
          if (assigned[u].length >= MIN) break;
        }
      }
    }
  }

  return assigned;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

console.log(`Processing ${words.length} French words...`);

// Step 1: classify all words
const classified = words.map((word, i) => ({
  word,
  cefrLevel: classifyLevel(word, i, words.length),
  partOfSpeech: inferPOS(word),
}));

// Step 2: group by level
const byLevel = { A1: [], A2: [], B1: [], B2: [] };
for (const entry of classified) {
  byLevel[entry.cefrLevel].push(entry);
}

// Step 3: write level files
for (const level of ['A1', 'A2', 'B1', 'B2']) {
  const file = path.join(DATA_DIR, `french-vocab-${level.toLowerCase()}.json`);
  fs.writeFileSync(file, JSON.stringify(byLevel[level], null, 2));
  console.log(`${level}: ${byLevel[level].length} words → ${file}`);
}

// Step 4: assign to units and write by-unit files
for (const level of ['A1', 'A2', 'B1', 'B2']) {
  const levelWords = byLevel[level].map(e => e.word);
  const units = assignToUnits(levelWords, UNIT_KEYWORDS[level]);
  const file = path.join(DATA_DIR, `french-vocab-${level.toLowerCase()}-by-unit.json`);
  fs.writeFileSync(file, JSON.stringify(units, null, 2));
  const counts = Object.values(units).map(arr => arr.length);
  console.log(`${level} by-unit: min=${Math.min(...counts)} max=${Math.max(...counts)} words/unit → ${file}`);
}

console.log('Done.');
