#!/usr/bin/env node
/**
 * Generates French curriculum content for all four CEFR levels (A1–B2).
 * Uses the DeepSeek API (deepseek-chat / DeepSeek V3).
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-french.js
 *   node --env-file=.env.local scripts/generate-french.js --level a1
 *   node --env-file=.env.local scripts/generate-french.js --level b2 --unit 1
 *   node --env-file=.env.local scripts/generate-french.js --fix-nulls
 *   node --env-file=.env.local scripts/generate-french.js --level b1 --fix-nulls
 *
 * Requires: DEEPSEEK_API_KEY in .env.local (get one at platform.deepseek.com)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const API_KEY = process.env.DEEPSEEK_API_KEY;
if (!API_KEY) { console.error('Error: DEEPSEEK_API_KEY is not set. Run with: node --env-file=.env.local scripts/generate-french.js'); process.exit(1); }

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

const DELAY_MS    = 0;
const BASE_DIR    = path.join(__dirname, '..');
const DATA_DIR    = path.join(BASE_DIR, 'data');
const OUTPUT_BASE = path.join(DATA_DIR, 'generated', 'fr');

const LEVELS = ['A1', 'A2', 'B1', 'B2'];

const WORD_COUNT    = { A1: '120-150', A2: '150-180', B1: '200-250', B2: '260-300' };
const DIAL_TURNS    = { A1: '10-12',   A2: '12-14',   B1: '14-16',   B2: '16-18'  };
const WRITE_MIN     = { A1: 60,  A2: 80,  B1: 120, B2: 180 };
const WRITE_MAX     = { A1: 100, A2: 130, B1: 180, B2: 250 };
const SPEAK_SECS    = { A1: 45,  A2: 45,  B1: 60,  B2: 60  };

const SYSTEM_PROMPT = `You are an expert French language curriculum designer. You create precise, well-structured content for French learners. You always respond with valid JSON only — no markdown, no code fences, no explanation text, no preamble. Your JSON must exactly match the structure specified in the user message.`;

// ─── UNIT DEFINITIONS ─────────────────────────────────────────────────────────

const UNITS = {

// ── A1 ────────────────────────────────────────────────────────────────────────
A1: [
  { unit:1, topic:"Les Routines Quotidiennes", knowledge_focus:"Comment les habitudes façonnent la productivité", toefl_angle:"Les écoles devraient-elles avoir des horaires journaliers fixes ?", grammar_point:"Le présent de l'indicatif (verbes réguliers en -er)", conjugaison:{ verb:"parler", tense:"Présent de l'indicatif", focus:"Terminaisons régulières -e, -es, -e, -ons, -ez, -ent" }, orthographe:{ rule:"L'accent aigu et l'accent grave (é, è)", focus:"Distinguer é et è dans les mots courants : réveil, lèvre, déjeuner" } },
  { unit:2, topic:"La Structure de la Famille", knowledge_focus:"Types de familles dans le monde", toefl_angle:"Les grandes familles ont-elles des avantages sur les petites ?", grammar_point:"Le verbe être au présent (je suis, tu es, il est…)", conjugaison:{ verb:"être", tense:"Présent de l'indicatif", focus:"Conjugaison irrégulière complète + emploi avec adjectifs" }, orthographe:{ rule:"Le genre des noms (masculin/féminin)", focus:"Terminaisons typiques du féminin : -ère, -ienne, -ette, -euse" } },
  { unit:3, topic:"L'Alimentation et la Santé", knowledge_focus:"Les bases de la nutrition", toefl_angle:"La restauration rapide est-elle un problème de santé grave ?", grammar_point:"L'article partitif (du, de la, de l', des)", conjugaison:{ verb:"manger", tense:"Présent de l'indicatif", focus:"Verbe en -ger : modification orthographique nous mangeons" }, orthographe:{ rule:"La formation du pluriel (-s, -x, -aux)", focus:"Pluriels réguliers et irréguliers : repas, gâteaux, animaux" } },
  { unit:4, topic:"La Vie en Ville et à la Campagne", knowledge_focus:"La vie urbaine et rurale", toefl_angle:"La vie en ville est-elle meilleure qu'à la campagne ?", grammar_point:"Il y a / Il n'y a pas de", conjugaison:{ verb:"habiter", tense:"Présent de l'indicatif", focus:"Verbes réguliers en -er, formes affirmative, négative, interrogative" }, orthographe:{ rule:"La cédille (ç)", focus:"Emploi de ç devant a, o, u : façade, leçon, reçu" } },
  { unit:5, topic:"Les Métiers et le Travail", knowledge_focus:"Types de travaux et leur valeur", toefl_angle:"Certains métiers sont-ils plus importants que d'autres ?", grammar_point:"La négation simple (ne … pas)", conjugaison:{ verb:"travailler", tense:"Présent de l'indicatif", focus:"Construction ne … pas + verbe régulier, contraction ne → n'" }, orthographe:{ rule:"Le féminin des noms de professions", focus:"Infirmier/infirmière, directeur/directrice, auteur/auteure" } },
  { unit:6, topic:"Le Sport et l'Activité Physique", knowledge_focus:"Les bienfaits de l'exercice", toefl_angle:"Le sport devrait-il être obligatoire à l'école ?", grammar_point:"Les adverbes de fréquence (toujours, souvent, jamais…)", conjugaison:{ verb:"faire", tense:"Présent de l'indicatif", focus:"Conjugaison irrégulière complète : je fais, nous faisons, ils font" }, orthographe:{ rule:"L'accent grave et l'accent aigu : distinction è/é", focus:"Très, après, règle, fête — emploi dans des mots sportifs courants" } },
  { unit:7, topic:"Les Voyages et l'Exploration", knowledge_focus:"Pourquoi les gens voyagent", toefl_angle:"Le voyage vous rend-il meilleur en tant que personne ?", grammar_point:"Les prépositions de lieu (à, en, au, aux, dans, sur)", conjugaison:{ verb:"aller", tense:"Présent de l'indicatif", focus:"Conjugaison irrégulière + contractions avec à : au, aux" }, orthographe:{ rule:"Les majuscules pour les noms de pays et de villes", focus:"La France, Paris, le Maroc, Rabat — règles de majuscules" } },
  { unit:8, topic:"La Technologie au Quotidien", knowledge_focus:"Les outils technologiques de base", toefl_angle:"La technologie a-t-elle simplifié ou compliqué la vie ?", grammar_point:"Les adjectifs possessifs (mon, ton, son, notre, votre, leur)", conjugaison:{ verb:"utiliser", tense:"Présent de l'indicatif", focus:"Verbes réguliers en -er + accord des possessifs selon le nom" }, orthographe:{ rule:"Le tréma (ë, ï, ü)", focus:"Noël, naïf, ambiguë — emploi du tréma pour séparer deux voyelles" } },
  { unit:9, topic:"L'École et l'Éducation", knowledge_focus:"Comment fonctionnent les écoles", toefl_angle:"L'école est-elle le meilleur endroit pour apprendre ?", grammar_point:"Les articles définis et indéfinis (le, la, les, un, une, des)", conjugaison:{ verb:"apprendre", tense:"Présent de l'indicatif", focus:"Conjugaison irrégulière complète d'apprendre (verbe en -prendre)" }, orthographe:{ rule:"Les majuscules dans les noms d'établissements scolaires", focus:"Le lycée Victor-Hugo, l'université de Paris — règles de majuscules" } },
  { unit:10, topic:"L'Argent et l'Économie de Base", knowledge_focus:"Gagner, épargner, dépenser", toefl_angle:"Devrait-on donner de l'argent de poche aux enfants ?", grammar_point:"Combien de / Combien d' + nom (dénombrement et mesure)", conjugaison:{ verb:"coûter", tense:"Présent de l'indicatif", focus:"Verbes réguliers en -er dans un contexte commercial" }, orthographe:{ rule:"L'écriture des nombres en lettres", focus:"Un, deux, vingt-et-un, cent, mille — tirets et accord des nombres" } },
  { unit:11, topic:"Le Monde Naturel", knowledge_focus:"Animaux, plantes, écosystèmes", toefl_angle:"Devrait-on faire davantage pour protéger la nature ?", grammar_point:"Les adjectifs qualificatifs : accord en genre et en nombre", conjugaison:{ verb:"vivre", tense:"Présent de l'indicatif", focus:"Conjugaison irrégulière de vivre + accord des adjectifs" }, orthographe:{ rule:"L'accord de l'adjectif en genre et en nombre", focus:"Grand/grande/grands/grandes — terminaisons régulières et irrégulières" } },
  { unit:12, topic:"La Météo et le Climat", knowledge_focus:"Saisons et phénomènes météorologiques", toefl_angle:"La météo influence-t-elle l'humeur et le comportement des gens ?", grammar_point:"Le présent progressif (être en train de + infinitif)", conjugaison:{ verb:"pleuvoir", tense:"Présent de l'indicatif (impersonnel)", focus:"Verbes impersonnels météorologiques : il pleut, il neige, il fait" }, orthographe:{ rule:"L'accent circonflexe (â, ê, î, ô, û)", focus:"Forêt, hôtel, île, fête — emploi de l'accent circonflexe" } },
  { unit:13, topic:"La Santé et les Maladies Courantes", knowledge_focus:"Les concepts de base de la santé", toefl_angle:"Les gouvernements devraient-ils fournir des soins de santé gratuits ?", grammar_point:"Le modal devoir + infinitif (obligation, conseil)", conjugaison:{ verb:"devoir", tense:"Présent de l'indicatif", focus:"Conjugaison irrégulière complète de devoir" }, orthographe:{ rule:"Les homophones grammaticaux (a/à, ou/où)", focus:"Il a faim / il va à l'hôpital — distinction a/à et ou/où" } },
  { unit:14, topic:"L'Amitié et les Relations", knowledge_focus:"Ce qui fait de bonnes relations", toefl_angle:"Les amitiés en ligne sont-elles aussi réelles que les amitiés hors ligne ?", grammar_point:"Les pronoms compléments COD (me, te, le, la, nous, vous, les)", conjugaison:{ verb:"aimer", tense:"Présent de l'indicatif", focus:"Verbes réguliers en -er + pronoms COD avant le verbe" }, orthographe:{ rule:"Le -s final muet dans les noms et adjectifs pluriels", focus:"Amis, relations, bons moments — -s non prononcé au pluriel" } },
  { unit:15, topic:"Le Logement et la Maison", knowledge_focus:"Types de logements dans le monde", toefl_angle:"Vaut-il mieux être propriétaire ou locataire ?", grammar_point:"Les prépositions de lieu (devant, derrière, à côté de, entre, en face de)", conjugaison:{ verb:"habiter", tense:"Présent de l'indicatif", focus:"Emploi de habiter + prépositions de lieu variées" }, orthographe:{ rule:"Les mots composés du logement (trait d'union)", focus:"Salle-de-bain, garde-robe, rez-de-chaussée — trait d'union" } },
  { unit:16, topic:"Les Achats et la Consommation", knowledge_focus:"Comment et pourquoi les gens font des achats", toefl_angle:"Les gens achètent-ils trop de choses dont ils n'ont pas besoin ?", grammar_point:"Les adjectifs démonstratifs (ce, cet, cette, ces)", conjugaison:{ verb:"acheter", tense:"Présent de l'indicatif", focus:"Verbes en -eter : doublement de consonne → j'achète" }, orthographe:{ rule:"Les verbes en -eter et -eler (doublement de consonne)", focus:"Acheter → j'achète, appeler → j'appelle — règles et exceptions" } },
  { unit:17, topic:"La Musique dans Nos Vies", knowledge_focus:"L'impact de la musique sur nous", toefl_angle:"L'éducation musicale devrait-elle être obligatoire à l'école ?", grammar_point:"Aimer / Adorer / Détester + infinitif ou nom", conjugaison:{ verb:"chanter", tense:"Présent de l'indicatif", focus:"Verbes réguliers en -er dans un contexte musical" }, orthographe:{ rule:"Les noms d'instruments et genres musicaux", focus:"Guitare, violon, jazz, classique — accents et majuscules" } },
  { unit:18, topic:"Les Livres et les Écrans", knowledge_focus:"L'évolution des habitudes de lecture", toefl_angle:"Les livres numériques sont-ils meilleurs que les livres imprimés ?", grammar_point:"Le comparatif (plus … que, moins … que, aussi … que)", conjugaison:{ verb:"lire", tense:"Présent de l'indicatif", focus:"Conjugaison irrégulière de lire + comparatifs intégrés" }, orthographe:{ rule:"Les terminaisons des adjectifs comparatifs", focus:"Accord de meilleur/meilleure, plus grand/grande" } },
  { unit:19, topic:"Les Animaux et les Animaux de Compagnie", knowledge_focus:"Les relations entre les humains et les animaux", toefl_angle:"Les animaux sauvages devraient-ils être gardés dans des zoos ?", grammar_point:"La possession avec de + nom (le chien de ma sœur)", conjugaison:{ verb:"nourrir", tense:"Présent de l'indicatif", focus:"Verbes réguliers en -ir (2e groupe) : terminaisons -is, -it, -issons" }, orthographe:{ rule:"Le genre des noms d'animaux", focus:"Un chat/une chatte, un chien/une chienne, un cheval/une jument" } },
  { unit:20, topic:"Les Transports et les Déplacements", knowledge_focus:"Comment les gens se déplacent en ville", toefl_angle:"Les transports en commun devraient-ils être gratuits pour tous ?", grammar_point:"Le modal pouvoir + infinitif (capacité, permission)", conjugaison:{ verb:"pouvoir", tense:"Présent de l'indicatif", focus:"Conjugaison irrégulière complète de pouvoir" }, orthographe:{ rule:"Les abréviations des moyens de transport", focus:"TGV, RER, SNCF — majuscules, points et accord des abréviations" } },
  { unit:21, topic:"Les Personnalités Célèbres et les Modèles", knowledge_focus:"Ce qui rend quelqu'un admirable", toefl_angle:"Les célébrités sont-elles de bons modèles ?", grammar_point:"Le passé composé avec être (verbes de déplacement et de changement)", conjugaison:{ verb:"venir", tense:"Passé composé (avec être)", focus:"Accord du participe passé avec être selon le sujet" }, orthographe:{ rule:"L'accord du participe passé avec être", focus:"Elle est venue, ils sont partis, elles sont nées — terminaisons" } },
  { unit:22, topic:"Les Traditions Culturelles", knowledge_focus:"Les coutumes à travers le monde", toefl_angle:"Les traditions culturelles doivent-elles être préservées ?", grammar_point:"Le passé composé avec avoir (verbes réguliers en -er)", conjugaison:{ verb:"célébrer", tense:"Passé composé (avec avoir)", focus:"Formation du participe passé -er → -é + auxiliaire avoir" }, orthographe:{ rule:"Les majuscules dans les noms de fêtes et traditions", focus:"Le Ramadan, la Fête nationale, Noël — règles de majuscules" } },
  { unit:23, topic:"L'Art et la Créativité", knowledge_focus:"Pourquoi les humains créent de l'art", toefl_angle:"L'art devrait-il être enseigné à l'école ?", grammar_point:"Le passé composé (verbes irréguliers : faire, dire, prendre, voir)", conjugaison:{ verb:"faire", tense:"Passé composé", focus:"Participes passés irréguliers : fait, dit, pris, vu, mis" }, orthographe:{ rule:"Les terminaisons des participes passés irréguliers (-u, -i, -is, -it, -ert)", focus:"Avoir eu, avoir dit, avoir pris, avoir ouvert — orthographe" } },
  { unit:24, topic:"Le Bénévolat et l'Entraide", knowledge_focus:"Les bases du service communautaire", toefl_angle:"Le bénévolat devrait-il être obligatoire ?", grammar_point:"La négation au passé composé (ne … pas / ne … jamais)", conjugaison:{ verb:"aider", tense:"Passé composé", focus:"Place de ne … pas autour de l'auxiliaire au passé composé" }, orthographe:{ rule:"Les suffixes -isme, -iste, -aire (bénévolat, solidarité)", focus:"Humanisme, bénévole, volontaire — orthographe et accord" } },
  { unit:25, topic:"Le Sommeil et le Repos", knowledge_focus:"Pourquoi le sommeil est important", toefl_angle:"La journée scolaire devrait-elle commencer plus tard ?", grammar_point:"Les adverbes de manière en -ment", conjugaison:{ verb:"dormir", tense:"Présent de l'indicatif", focus:"Conjugaison irrégulière de dormir (3e groupe)" }, orthographe:{ rule:"La formation des adverbes en -ment", focus:"Adjectif féminin + -ment : lentement, rapidement, calmement" } },
  { unit:26, topic:"La Nourriture dans le Monde", knowledge_focus:"La culture alimentaire mondiale", toefl_angle:"Votre alimentation reflète-t-elle votre identité ?", grammar_point:"Les partitifs avec la négation (pas de / pas d')", conjugaison:{ verb:"cuisiner", tense:"Présent de l'indicatif", focus:"Verbes réguliers en -er dans un contexte culinaire" }, orthographe:{ rule:"Les noms de plats et de cuisines du monde", focus:"Le couscous, la paella, le sushi — genre et orthographe" } },
  { unit:27, topic:"Apprendre les Langues", knowledge_focus:"Les avantages du multilinguisme", toefl_angle:"Tout le monde devrait-il apprendre une deuxième langue ?", grammar_point:"Le futur proche (aller + infinitif)", conjugaison:{ verb:"apprendre", tense:"Futur proche (aller + infinitif)", focus:"Construction aller (présent) + infinitif pour exprimer le futur immédiat" }, orthographe:{ rule:"Les mots d'origine étrangère en français", focus:"Week-end, pizza, spaghetti, rugby — pluriel et genre" } },
  { unit:28, topic:"Les Bases d'Internet", knowledge_focus:"Comment internet a changé la communication", toefl_angle:"Internet a-t-il amélioré la communication ?", grammar_point:"Le futur simple (verbes réguliers en -er, -ir)", conjugaison:{ verb:"changer", tense:"Futur simple", focus:"Terminaisons du futur simple : -rai, -ras, -ra, -rons, -rez, -ront" }, orthographe:{ rule:"Les mots du numérique et les anglicismes", focus:"Email, blog, selfie — genre et orthographe des mots empruntés" } },
  { unit:29, topic:"L'Environnement et le Recyclage", knowledge_focus:"Les déchets et la durabilité", toefl_angle:"Les sacs en plastique devraient-ils être interdits ?", grammar_point:"Il faut + infinitif (obligation impersonnelle)", conjugaison:{ verb:"recycler", tense:"Présent de l'indicatif", focus:"Verbes réguliers en -er dans un contexte environnemental" }, orthographe:{ rule:"Les mots composés de l'environnement (trait d'union)", focus:"Éco-responsable, recyclage, développement durable — trait d'union" } },
  { unit:30, topic:"Les Objectifs et la Réussite Personnelle", knowledge_focus:"Ce que signifie le succès", toefl_angle:"La réussite dépend-elle davantage du travail ou du talent ?", grammar_point:"Le superlatif (le/la/les plus …, le/la/les moins …)", conjugaison:{ verb:"réussir", tense:"Présent de l'indicatif", focus:"Verbes réguliers en -ir (2e groupe) : terminaisons -is, -issons, -issent" }, orthographe:{ rule:"Les suffixes -eur, -eux, -able, -ible", focus:"Travailleur, courageux, remarquable, possible — formation et accord" } },
],

// ── A2 ────────────────────────────────────────────────────────────────────────
A2: [
  { unit:1,  topic:"La Science du Sommeil",                      knowledge_focus:"Cycles du sommeil, mémoire, santé",                            toefl_angle:"Les écoles devraient-elles interdire les cours tôt le matin ?",           grammar_point:"Présent continu vs présent simple",                          conjugaison:{ verb:"s'endormir",           tense:"Présent de l'indicatif (pronominal)",  focus:"Verbes pronominaux au présent" },                                                        orthographe:{ rule:"Les verbes pronominaux : orthographe et accord",                    focus:"Se lever, se coucher, se réveiller — formes et accords" } },
  { unit:2,  topic:"De la Ferme à l'Assiette",                   knowledge_focus:"Agriculture et chaînes d'approvisionnement alimentaire",       toefl_angle:"Les gens devraient-ils manger moins de viande ?",                        grammar_point:"Passif présent (simple)",                                     conjugaison:{ verb:"produire",              tense:"Présent + passif",                     focus:"Verbes en -uire + construction passive" },                                               orthographe:{ rule:"Les participes passés en -u, -i, -is, -it",                         focus:"Produit, écrit, pris, mis — orthographe des participes irréguliers" } },
  { unit:3,  topic:"Grandir dans Différentes Cultures",           knowledge_focus:"L'enfance à travers le monde",                                toefl_angle:"La culture détermine-t-elle qui vous devenez ?",                        grammar_point:"L'imparfait — habitudes passées",                             conjugaison:{ verb:"jouer",                 tense:"Imparfait",                            focus:"Formation de l'imparfait + usage pour les habitudes" },                                  orthographe:{ rule:"Les terminaisons de l'imparfait",                                   focus:"-ais, -ait, -ions, -iez, -aient — confusion avec passé composé" } },
  { unit:4,  topic:"L'Histoire de l'Argent",                     knowledge_focus:"Du troc aux paiements numériques",                            toefl_angle:"L'argent liquide va-t-il disparaître à l'avenir ?",                     grammar_point:"Imparfait vs passé composé",                                  conjugaison:{ verb:"payer",                 tense:"Imparfait + passé composé",            focus:"Contraste imparfait/passé composé avec payer et acheter" },                               orthographe:{ rule:"Verbes en -ayer, -oyer, -uyer",                                     focus:"Payer → je paie/paye, envoyer → j'envoie — règles et variantes" } },
  { unit:5,  topic:"Les Grandes Inventions qui ont Changé le Monde", knowledge_focus:"Imprimerie, électricité, internet",                      toefl_angle:"Quelle invention a eu le plus grand impact sur l'humanité ?",           grammar_point:"Passif passé (simple)",                                       conjugaison:{ verb:"inventer",              tense:"Passé composé + passif passé",         focus:"A été inventé / ont été découverts — construction et accord" },                           orthographe:{ rule:"Accord du participe passé au passif",                               focus:"La télévision a été inventée — règles d'accord au passif" } },
  { unit:6,  topic:"L'Eau : La Ressource la Plus Précieuse du Monde", knowledge_focus:"Pénurie d'eau et accès",                               toefl_angle:"L'eau devrait-elle être traitée comme un droit humain ?",              grammar_point:"Les quantificateurs (beaucoup de, peu de, assez de, trop de)", conjugaison:{ verb:"manquer",               tense:"Présent + imparfait",                  focus:"Manquer de + nom + conjugaison dans différents temps" },                                  orthographe:{ rule:"De/des après un adverbe de quantité",                               focus:"Beaucoup de eau → beaucoup d'eau — élision et règles" } },
  { unit:7,  topic:"Comment les Villes Grandissent",              knowledge_focus:"Les bases de l'urbanisation",                                toefl_angle:"Les grandes villes sont-elles de meilleurs endroits que les petites ?", grammar_point:"Comparatif et superlatif — révision avec que",                 conjugaison:{ verb:"construire",            tense:"Présent + passé composé",              focus:"Verbes en -uire : construire, détruire, produire" },                                      orthographe:{ rule:"Les adjectifs numéraux ordinaux",                                   focus:"Premier, deuxième, troisième — orthographe et accord" } },
  { unit:8,  topic:"Le Rôle des Femmes dans la Société",          knowledge_focus:"Les progrès de l'égalité des sexes",                         toefl_angle:"Les femmes ont-elles atteint une véritable égalité ?",                  grammar_point:"Les adverbes de degré (assez, très, trop, suffisamment)",     conjugaison:{ verb:"obtenir",               tense:"Présent + passé composé",              focus:"Verbes en -tenir : obtenir, maintenir, retenir" },                                        orthographe:{ rule:"Féminisation des adjectifs irréguliers",                            focus:"Beau/belle, nouveau/nouvelle, vieux/vieille, long/longue" } },
  { unit:9,  topic:"Pourquoi les Gens Immigrent",                 knowledge_focus:"Facteurs d'attraction et de répulsion de la migration",       toefl_angle:"L'immigration bénéficie-t-elle au pays d'accueil ?",                   grammar_point:"Cause et but (parce que, donc, pour + infinitif)",            conjugaison:{ verb:"quitter",               tense:"Présent + passé composé",              focus:"Partir vs quitter — usage et conjugaison" },                                              orthographe:{ rule:"Les conjonctions de coordination : MAIS OÙ ET DONC OR NI CAR",     focus:"Orthographe et ponctuation avec les conjonctions de coordination" } },
  { unit:10, topic:"Les Réseaux Sociaux et les Jeunes",           knowledge_focus:"Comment les plateformes façonnent l'identité",                toefl_angle:"Les réseaux sociaux devraient-ils avoir un âge minimum ?",             grammar_point:"La première conditionnelle (si + présent, futur simple)",     conjugaison:{ verb:"partager",              tense:"Présent + futur simple",               focus:"Verbes en -ger + futur simple pour la conditionnelle" },                                  orthographe:{ rule:"Les anglicismes et leur orthographe en français",                   focus:"Selfie, like, hashtag, story — orthographe et genre" } },
  { unit:11, topic:"Les Jeux Olympiques",                         knowledge_focus:"Histoire et signification des Jeux",                          toefl_angle:"Les Jeux Olympiques ont-ils encore leur importance aujourd'hui ?",      grammar_point:"Le passé composé avec déjà/jamais (ever/never)",              conjugaison:{ verb:"gagner",                tense:"Passé composé + négation",             focus:"N'avoir jamais + participe, n'avoir pas encore + participe" },                            orthographe:{ rule:"Les noms propres et majuscules dans les événements sportifs",       focus:"Les Jeux Olympiques, la Coupe du Monde — règles de majuscules" } },
  { unit:12, topic:"Les Bases du Changement Climatique",          knowledge_focus:"CO2, effet de serre, conséquences",                          toefl_angle:"L'action individuelle suffit-elle pour lutter contre le changement climatique ?", grammar_point:"Le passé composé avec depuis et il y a",              conjugaison:{ verb:"augmenter",             tense:"Passé composé + présent avec depuis",  focus:"La température a augmenté depuis 50 ans — structure et sens" },                           orthographe:{ rule:"Les mots scientifiques d'origine grecque et latine",                focus:"Atmosphère, écosystème, biodiversité — orthographe" } },
  { unit:13, topic:"L'Essor du Shopping en Ligne",                knowledge_focus:"Le e-commerce et ses effets",                                toefl_angle:"Le shopping en ligne remplacera-t-il les magasins physiques ?",         grammar_point:"Passé composé vs imparfait — révision complète",              conjugaison:{ verb:"commander",             tense:"Passé composé + imparfait",            focus:"J'attendais (imparfait) / le colis est arrivé (PC) — contraste" },                        orthographe:{ rule:"Les préfixes négatifs : in-, im-, ir-, il-",                        focus:"Impossible, illégal, irrégulier, inconnu — règles d'assimilation" } },
  { unit:14, topic:"La Santé Mentale",                            knowledge_focus:"Stress, anxiété et bien-être émotionnel",                    toefl_angle:"La santé mentale devrait-elle être enseignée à l'école ?",             grammar_point:"Les verbes modaux de conseil (devoir, falloir, valoir mieux)", conjugaison:{ verb:"se sentir",             tense:"Présent + imparfait (pronominal)",      focus:"Verbes pronominaux de sentiment : se sentir, se détendre" },                              orthographe:{ rule:"Les suffixes -tion, -sion, -cion",                                  focus:"Attention, émotion, tension, expression — orthographe" } },
  { unit:15, topic:"Les Bases de l'Exploration Spatiale",         knowledge_focus:"Pourquoi nous explorons l'espace",                           toefl_angle:"Vaut-il la peine de dépenser de l'argent pour l'exploration spatiale ?", grammar_point:"Le futur continu (futur simple + être en train de)",        conjugaison:{ verb:"explorer",              tense:"Futur simple",                         focus:"Futur simple des verbes réguliers et irréguliers clés" },                                 orthographe:{ rule:"Les noms composés avec trait d'union",                              focus:"Arc-en-ciel, chef-d'œuvre, rendez-vous — règles et pluriel" } },
  { unit:16, topic:"Les Espèces en Voie de Disparition",          knowledge_focus:"Causes d'extinction et prévention",                          toefl_angle:"Les gouvernements devraient-ils dépenser pour sauver les animaux en danger ?", grammar_point:"Les modaux de possibilité (pouvoir, il est possible que)", conjugaison:{ verb:"disparaître",           tense:"Présent + futur simple",               focus:"Verbes en -aître : disparaître, paraître, connaître" },                                   orthographe:{ rule:"L'accent circonflexe sur les verbes en -aître",                    focus:"Il paraît, il connaît, il disparaît — règle du î avant t" } },
  { unit:17, topic:"L'Éducation dans le Monde",                   knowledge_focus:"Comment les systèmes scolaires diffèrent",                   toefl_angle:"L'éducation devrait-elle être entièrement gratuite pour tous ?",       grammar_point:"Le discours indirect — les déclarations",                     conjugaison:{ verb:"dire",                  tense:"Présent + discours indirect",          focus:"Il dit que… + concordance des temps au discours indirect" },                              orthographe:{ rule:"Les guillemets français et la ponctuation du dialogue",            focus:"« Bonjour », dit-il. — Règles des guillemets et tirets" } },
  { unit:18, topic:"Le Pouvoir de la Publicité",                  knowledge_focus:"Comment les publicités influencent les décisions",            toefl_angle:"La publicité destinée aux enfants devrait-elle être interdite ?",      grammar_point:"Le discours indirect — les questions",                        conjugaison:{ verb:"demander",              tense:"Présent + discours indirect interrogatif", focus:"Il demande si… / Elle veut savoir pourquoi… — structures" },                          orthographe:{ rule:"Les majuscules dans les titres et slogans",                         focus:"Règles françaises pour les titres de films et d'œuvres" } },
  { unit:19, topic:"La Démocratie et le Vote",                    knowledge_focus:"Comment fonctionnent les systèmes démocratiques",            toefl_angle:"Le vote devrait-il être obligatoire ?",                                grammar_point:"Les verbes modaux d'obligation (devoir, il faut, être obligé de)", conjugaison:{ verb:"voter",              tense:"Présent + passé composé + futur",      focus:"Révision des trois temps avec verbes civiques" },                                         orthographe:{ rule:"Les noms d'institutions et d'organisations",                        focus:"L'Assemblée nationale, le Sénat, l'ONU — majuscules" } },
  { unit:20, topic:"Les Énergies Renouvelables",                  knowledge_focus:"Solaire, éolien et alternatives vertes",                     toefl_angle:"Les gouvernements devraient-ils investir davantage dans les énergies renouvelables ?", grammar_point:"La conditionnelle zéro (si + présent, présent)",        conjugaison:{ verb:"produire",              tense:"Présent (conditionnel zéro)",          focus:"Si on utilise le solaire, on réduit les émissions" },                                     orthographe:{ rule:"Les suffixes -ible et -able",                                       focus:"Renouvelable, durable, possible, responsable — orthographe" } },
  { unit:21, topic:"L'Industrie de la Fast Fashion",              knowledge_focus:"Comment les vêtements sont fabriqués et gaspillés",          toefl_angle:"La fast fashion détruit-elle la planète ?",                            grammar_point:"Les propositions relatives (qui, que, dont, où)",             conjugaison:{ verb:"fabriquer",             tense:"Présent + passé composé",              focus:"Révision avec propositions relatives intégrées" },                                        orthographe:{ rule:"Les homophones : quand/quant/qu'en",                                focus:"Quand il arrive / quant à moi / qu'en penses-tu — règles" } },
  { unit:22, topic:"Santé Publique et Vaccination",               knowledge_focus:"Comment les vaccins protègent les communautés",              toefl_angle:"La vaccination devrait-elle être obligatoire ?",                       grammar_point:"Aurait dû / Aurait pu (conseils sur le passé)",               conjugaison:{ verb:"vacciner",              tense:"Conditionnel passé (introduction)",    focus:"Il aurait dû se faire vacciner — formation et usage" },                                   orthographe:{ rule:"Les mots médicaux latins francisés",                                focus:"Vaccin, virus, bactérie, symptôme — orthographe médicale" } },
  { unit:23, topic:"La Fracture Numérique",                       knowledge_focus:"L'accès inégal à la technologie",                           toefl_angle:"Le manque d'accès à Internet est-il une forme d'inégalité ?",         grammar_point:"Les pronoms indéfinis (quelqu'un, personne, tout le monde, chacun)", conjugaison:{ verb:"accéder",           tense:"Présent + futur simple",               focus:"Accéder à + complément + conjugaison avec pronoms indéfinis" },                           orthographe:{ rule:"Les pronoms indéfinis : orthographe et accord",                     focus:"Tout le monde est / quelqu'un a / personne n'a — accords" } },
  { unit:24, topic:"Le Bénévolat et l'Aide Internationale",       knowledge_focus:"Comment fonctionnent les ONG",                               toefl_angle:"L'aide étrangère aide-t-elle vraiment les pays en développement ?",   grammar_point:"Les verbes suivis de l'infinitif ou du gérondif",             conjugaison:{ verb:"soutenir",              tense:"Présent + passé composé",              focus:"Verbes en -tenir + structures infinitives et gérondives" },                               orthographe:{ rule:"Le gérondif : formation et orthographe",                            focus:"En aidant, en faisant, en étant — formation et exceptions" } },
  { unit:25, topic:"L'Histoire des Droits de l'Homme",            knowledge_focus:"Étapes clés et documents fondateurs",                        toefl_angle:"Les droits de l'homme sont-ils vraiment universels ?",                grammar_point:"Le plus-que-parfait — introduction",                          conjugaison:{ verb:"proclamer",             tense:"Plus-que-parfait",                     focus:"Avait proclamé / avaient signé — formation et usage narratif" },                          orthographe:{ rule:"Les noms de documents historiques et traités",                     focus:"La Déclaration des droits de l'homme — majuscules dans les titres" } },
  { unit:26, topic:"Sécurité Alimentaire et Faim dans le Monde",  knowledge_focus:"Pourquoi des gens ont faim dans un monde d'abondance",       toefl_angle:"Qui est responsable de la résolution de la faim dans le monde ?",    grammar_point:"Le causatif faire + infinitif",                               conjugaison:{ verb:"distribuer",            tense:"Présent + causatif",                   focus:"Faire pousser, faire produire, faire distribuer" },                                        orthographe:{ rule:"Les faux amis orthographiques courants",                            focus:"Davantage vs d'avantage, plutôt vs plus tôt, quoique vs quoi que" } },
  { unit:27, topic:"La Psychologie du Bonheur",                   knowledge_focus:"Ce qui rend les gens heureux",                               toefl_angle:"L'argent mène-t-il au bonheur ?",                                     grammar_point:"Si / Tellement / Tant / Assez pour (intensificateurs)",       conjugaison:{ verb:"ressentir",             tense:"Présent + imparfait (pronominal)",      focus:"Verbes de sentiment + intensificateurs intégrés" },                                       orthographe:{ rule:"Les adverbes en -ment à partir d'adjectifs en -ant et -ent",        focus:"Couramment, évidemment, prudemment — exceptions" } },
  { unit:28, topic:"Les Bases de l'Intelligence Artificielle",    knowledge_focus:"Ce qu'est l'IA et comment elle fonctionne",                  toefl_angle:"L'IA va-t-elle supprimer des emplois humains ?",                      grammar_point:"Le futur antérieur (futur parfait)",                          conjugaison:{ verb:"remplacer",             tense:"Futur antérieur",                      focus:"Aura remplacé / auront développé — formation et usage" },                                 orthographe:{ rule:"Les acronymes et abréviations technologiques",                      focus:"IA, algorithme, données, interface — orthographe et genre" } },
  { unit:29, topic:"Patrimoine Culturel et Tourisme",             knowledge_focus:"Comment le tourisme affecte la culture locale",              toefl_angle:"Le tourisme fait-il plus de mal que de bien ?",                        grammar_point:"Les articles avancés — article zéro et le générique",         conjugaison:{ verb:"visiter",               tense:"Présent + futur simple + conditionnel", focus:"Introduction au conditionnel : on devrait, on pourrait" },                                 orthographe:{ rule:"Les mots d'emprunt des langues étrangères",                         focus:"Château, café, ballet, souvenir — mots français et emprunts" } },
  { unit:30, topic:"L'Avenir du Travail",                         knowledge_focus:"Comment les emplois évoluent",                               toefl_angle:"La semaine de travail devrait-elle être réduite à 4 jours ?",          grammar_point:"La deuxième conditionnelle (si + imparfait, conditionnel présent)", conjugaison:{ verb:"travailler",         tense:"Conditionnel présent",                 focus:"Je travaillerais, on automatiserait — formation complète" },                               orthographe:{ rule:"Les terminaisons du conditionnel : -rais, -rait, -raient",          focus:"Ne pas confondre conditionnel (-rais) et futur (-rai)" } },
],

// ── B1 ────────────────────────────────────────────────────────────────────────
B1: [
  { unit:1,  topic:"La Psychologie de la Motivation",             knowledge_focus:"Motivation intrinsèque vs extrinsèque",                     toefl_angle:"Les récompenses sont-elles efficaces pour améliorer les performances ?", grammar_point:"Le présent parfait continu (passé composé + depuis + durée)", conjugaison:{ verb:"se motiver",            tense:"Présent + passé composé + depuis",      focus:"Il travaille depuis trois ans / Il a travaillé pendant trois ans" },               orthographe:{ rule:"Les suffixes -isme et -iste",                                       focus:"Optimisme/optimiste, réalisme/réaliste — orthographe et accord" } },
  { unit:2,  topic:"L'Économie des Plateformes",                  knowledge_focus:"Le travail freelance et son essor",                          toefl_angle:"L'économie des plateformes exploite-t-elle les travailleurs ?",        grammar_point:"Le plus-que-parfait continu",                                 conjugaison:{ verb:"travailler",            tense:"Plus-que-parfait",                     focus:"Il travaillait depuis des années avant de trouver — PQP + imparfait" },          orthographe:{ rule:"Les mots en -eur, -eure, -heure",                                   focus:"Travailleur, meilleure, demeure, heure — homophones" } },
  { unit:3,  topic:"Urbanisation et Inégalités",                  knowledge_focus:"Comment la croissance urbaine crée des gagnants et des perdants", toefl_angle:"Les villes créent-elles plus d'inégalités que d'opportunités ?", grammar_point:"Les conditionnelles mixtes — introduction",                    conjugaison:{ verb:"s'installer",           tense:"Conditionnel présent + passé composé",  focus:"Si j'avais eu de l'argent, je vivrais mieux — structure mixte" },                 orthographe:{ rule:"Les noms en -té et -tié",                                           focus:"Liberté, moitié, beauté, pitié — orthographe et genre" } },
  { unit:4,  topic:"L'Éducation aux Médias",                      knowledge_focus:"Comment évaluer les sources d'information de façon critique", toefl_angle:"L'éducation aux médias devrait-elle être une matière obligatoire ?", grammar_point:"Les modaux de déduction (devoir être, ne pas pouvoir être)",   conjugaison:{ verb:"vérifier",              tense:"Présent + conditionnel (déduction)",    focus:"Ça doit être vrai, ça ne peut pas être faux — modaux" },                          orthographe:{ rule:"Les préfixes d'origine grecque : hyper-, hypo-, poly-, mono-",      focus:"Hypermarché, hypothèse, polytechnique, monologue" } },
  { unit:5,  topic:"La Science de la Mémoire",                    knowledge_focus:"Comment la mémoire fonctionne et comment l'améliorer",       toefl_angle:"Les écoles devraient-elles adapter leur enseignement au fonctionnement de la mémoire ?", grammar_point:"Les modaux passés (aurait dû, aurait pu, n'aurait pas pu)", conjugaison:{ verb:"mémoriser",          tense:"Conditionnel passé",                   focus:"J'aurais dû réviser, elle n'aurait pas pu se souvenir" },                          orthographe:{ rule:"Les doublets orthographiques : -mm-, -nn-, -ll-, -tt-",             focus:"Mémoire, connaissance, intelligence, attention — doublement" } },
  { unit:6,  topic:"La Pollution des Océans",                     knowledge_focus:"Plastique, produits chimiques et vie marine",                toefl_angle:"Les entreprises devraient-elles être légalement responsables de la pollution des océans ?", grammar_point:"Le passif — tous les temps",                               conjugaison:{ verb:"polluer",               tense:"Passif présent, passé, futur",          focus:"Est pollué, a été contaminé, sera nettoyé — passif complet" },                    orthographe:{ rule:"Les mots en -eau, -aume, -eaume",                                   focus:"Niveau, tableau, eau, baume — pluriels et orthographe" } },
  { unit:7,  topic:"L'Éthique des Zoos",                          knowledge_focus:"Le débat conservation vs captivité",                         toefl_angle:"Les zoos modernes font-ils plus de bien que de mal ?",                grammar_point:"Les propositions relatives définissantes et non-définissantes", conjugaison:{ verb:"capturer",            tense:"Présent + passé composé",              focus:"Révision avec relatives complexes intégrées" },                                   orthographe:{ rule:"La ponctuation des propositions relatives non-définissantes",        focus:"Les virgules autour des relatives explicatives — règles" } },
  { unit:8,  topic:"Les Inégalités de Revenus",                   knowledge_focus:"Le fossé entre riches et pauvres",                           toefl_angle:"Les gouvernements devraient-ils imposer des impôts plus élevés aux riches ?", grammar_point:"Les structures comparatives (plus on … plus on …)",        conjugaison:{ verb:"redistribuer",          tense:"Présent + conditionnel",               focus:"Verbes économiques + conditionnel pour les recommandations" },                    orthographe:{ rule:"Les chiffres et statistiques en toutes lettres",                    focus:"Deux tiers, un quart, 45 % — fractions et pourcentages" } },
  { unit:9,  topic:"L'Influence des Réseaux Sociaux sur la Politique", knowledge_focus:"Comment les plateformes façonnent l'opinion politique", toefl_angle:"Les entreprises de réseaux sociaux devraient-elles réguler le contenu politique ?", grammar_point:"Le discours indirect — ordres, demandes, suggestions",  conjugaison:{ verb:"influencer",            tense:"Présent + discours indirect",          focus:"Il a dit de voter — discours indirect à l'impératif" },                           orthographe:{ rule:"Les verbes en -cer et leur cédille",                                focus:"Influencer → il influençait, lancer → nous lançons" } },
  { unit:10, topic:"L'Industrie Alimentaire Mondiale",            knowledge_focus:"Élevage industriel, gaspillage, durabilité",                 toefl_angle:"Les gens devraient-ils être taxés pour avoir mangé de la viande ?",  grammar_point:"Le causatif passif (faire faire quelque chose)",              conjugaison:{ verb:"produire",              tense:"Présent + causatif + passif",          focus:"Faire produire, faire transformer — causatif actif et passif" },                  orthographe:{ rule:"Les mots en -tion vs -sion vs -ssion",                              focus:"Nutrition, décision, permission, passion — règles" } },
  { unit:11, topic:"L'Histoire du Colonialisme",                  knowledge_focus:"Comment les empires européens ont façonné le monde",         toefl_angle:"Les anciennes puissances coloniales sont-elles responsables des inégalités mondiales actuelles ?", grammar_point:"Les temps narratifs (passé simple, imparfait, plus-que-parfait)", conjugaison:{ verb:"coloniser",      tense:"Passé simple (introduction à la lecture)", focus:"Il colonisa, ils résistèrent — passé simple en lecture" },                       orthographe:{ rule:"Le passé simple — terminaisons et orthographe",                     focus:"-a/-èrent, -it/-irent, -ut/-urent — les trois groupes" } },
  { unit:12, topic:"L'Addiction à la Technologie",                knowledge_focus:"Temps d'écran, dopamine, dépendance numérique",              toefl_angle:"Les smartphones devraient-ils être interdits dans les écoles ?",      grammar_point:"Gérondifs vs infinitifs — changement de sens (arrêter, essayer, se souvenir)", conjugaison:{ verb:"arrêter",        tense:"Présent + infinitif/gérondif",         focus:"Arrêter de faire vs arrêter en faisant — nuances de sens" },                      orthographe:{ rule:"Les mots composés avec préfixe numérique",                          focus:"Cyber-, auto-, micro-, télé- — trait d'union ou soudure" } },
  { unit:13, topic:"Le Revenu Universel de Base",                 knowledge_focus:"L'idée d'un revenu garanti pour tous",                       toefl_angle:"Un revenu universel de base réduirait-il la pauvreté ?",              grammar_point:"La troisième conditionnelle (si + plus-que-parfait, conditionnel passé)", conjugaison:{ verb:"recevoir",       tense:"Conditionnel passé",                   focus:"Si on avait mis en place ce système, les inégalités auraient diminué" },          orthographe:{ rule:"Les noms abstraits en -ité, -ude",                                  focus:"Pauvreté, égalité, solidarité, certitude — formation" } },
  { unit:14, topic:"Les Échecs du Système Éducatif",              knowledge_focus:"Tests standardisés et créativité",                           toefl_angle:"Les tests standardisés nuisent-ils plus aux élèves qu'ils ne les aident ?", grammar_point:"Wish + subjonctif passé / imparfait / conditionnel",     conjugaison:{ verb:"réformer",              tense:"Conditionnel présent + subjonctif",     focus:"On voudrait que le système change — subjonctif intro" },                          orthographe:{ rule:"Le subjonctif présent — terminaisons",                              focus:"-e, -es, -e, -ions, -iez, -ent — terminaisons et orthographe" } },
  { unit:15, topic:"La Montée du Nationalisme",                   knowledge_focus:"Pourquoi l'identité nationale se renforce",                  toefl_angle:"Le nationalisme est-il une menace pour la coopération mondiale ?",    grammar_point:"Les mots de liaison de contraste (bien que, malgré, cependant, néanmoins)", conjugaison:{ verb:"appartenir",      tense:"Présent + imparfait",                  focus:"Verbes en -enir dans le contexte identitaire" },                                  orthographe:{ rule:"Les locutions conjonctives de concession",                          focus:"Bien que (+ subjonctif), malgré (+ nom), même si (+ indicatif)" } },
  { unit:16, topic:"Justice Pénale et Réhabilitation",            knowledge_focus:"Systèmes pénitentiaires et récidive",                        toefl_angle:"L'objectif de la prison devrait-il être la punition ou la réhabilitation ?", grammar_point:"Les modaux parfaits de critique (aurait dû, aurait pu)", conjugaison:{ verb:"condamner",          tense:"Conditionnel passé (critique)",        focus:"On aurait pu éviter — sens critique du conditionnel passé" },                     orthographe:{ rule:"Les termes juridiques et leur orthographe",                         focus:"Accusé, condamné, jugement, tribunal, acquittement" } },
  { unit:17, topic:"La Science du Changement Climatique",         knowledge_focus:"Cycles du carbone, points de basculement",                   toefl_angle:"Les climatosceptiques devraient-ils être tenus responsables ?",        grammar_point:"Le futur antérieur (prédictions et conditions futures)",      conjugaison:{ verb:"fondre",                tense:"Futur simple + futur antérieur",        focus:"Les glaciers auront fondu avant 2100 — futur antérieur" },                        orthographe:{ rule:"Les termes scientifiques en -logie, -graphie, -métrie",             focus:"Climatologie, géographie, thermométrie — formation" } },
  { unit:18, topic:"Les Rôles de Genre dans la Société Moderne",  knowledge_focus:"Comment les attentes de genre évoluent",                    toefl_angle:"Les rôles de genre traditionnels ont-ils encore leur place ?",         grammar_point:"L'inversion après les adverbiaux négatifs — introduction",    conjugaison:{ verb:"évoluer",               tense:"Présent + passé composé",              focus:"Verbes de changement + voix pronominale" },                                        orthographe:{ rule:"L'écriture inclusive : règles et recommandations",                  focus:"Chercheur·e·s, iel — état actuel des recommandations officielles" } },
  { unit:19, topic:"Le Pouvoir des Entreprises et les Monopoles", knowledge_focus:"Comment les grandes entreprises dominent les marchés",        toefl_angle:"Les grandes entreprises technologiques devraient-elles être démantelées ?", grammar_point:"Les articles avancés — référence institutionnelle",       conjugaison:{ verb:"dominer",               tense:"Présent + passif",                     focus:"Dominer le marché, être régulé par — verbes de pouvoir" },                        orthographe:{ rule:"Les noms d'entreprises et de marques en français",                  focus:"Google, Apple, L'Oréal — majuscules, articles et accords" } },
  { unit:20, topic:"La Crise des Réfugiés",                       knowledge_focus:"Causes et réponse mondiale aux déplacements",                toefl_angle:"Les nations riches ont-elles une obligation morale d'accueillir des réfugiés ?", grammar_point:"Les propositions participiales (-ant et -é en début de phrase)", conjugaison:{ verb:"fuir",              tense:"Présent + passé composé",              focus:"Conjugaison irrégulière de fuir + participes présents intégrés" },                orthographe:{ rule:"L'accord du participe présent vs adjectif verbal",                  focus:"Inquiétante (adj) vs en inquiétant les autorités (participe)" } },
  { unit:21, topic:"La Science de la Nutrition",                  knowledge_focus:"Comment l'alimentation affecte le cerveau et le corps",      toefl_angle:"Les gouvernements devraient-ils réglementer les produits alimentaires malsains ?", grammar_point:"Les propositions relatives réduites",               conjugaison:{ verb:"consommer",             tense:"Présent + passif",                     focus:"Verbes scientifiques + structures passives réduites" },                           orthographe:{ rule:"Les unités de mesure et leur abréviation",                          focus:"Gramme (g), kilocalorie (kcal), milligramme (mg)" } },
  { unit:22, topic:"La Cybercriminalité et la Sécurité Numérique", knowledge_focus:"Types de cybermenaces et impact mondial",                   toefl_angle:"Le hacking devrait-il jamais être légal ?",                           grammar_point:"Révision des conditionnelles (zéro, 1re, 2e, 3e)",            conjugaison:{ verb:"pirater",               tense:"Révision des quatre conditionnelles",   focus:"Révision complète avec contexte cybersécurité" },                                 orthographe:{ rule:"Le vocabulaire informatique : graphie et genre",                    focus:"Le spam, le phishing, une faille, un pare-feu" } },
  { unit:23, topic:"Le Rôle de la Religion dans la Société Moderne", knowledge_focus:"Foi, laïcité et vie publique",                          toefl_angle:"La religion devrait-elle influencer la politique gouvernementale ?", grammar_point:"Le subjonctif après suggérer, recommander, insister",         conjugaison:{ verb:"croire",                tense:"Présent + subjonctif présent",         focus:"Je suggère que tu lises / Il insiste pour que nous respections" },                 orthographe:{ rule:"Les noms de religions et leurs adjectifs",                          focus:"Chrétien, musulman, juif, bouddhiste — majuscules et accords" } },
  { unit:24, topic:"Biodiversité et Écosystèmes",                  knowledge_focus:"Pourquoi la diversité des espèces est importante",          toefl_angle:"Le développement économique devrait-il jamais être prioritaire sur la conservation ?", grammar_point:"Les verbes à particules (séparables vs inséparables)",    conjugaison:{ verb:"s'éteindre",            tense:"Présent + passé composé",              focus:"Conjugaison de s'éteindre + participes accordés" },                               orthographe:{ rule:"Les noms scientifiques d'espèces : conventions",                   focus:"Homo sapiens, Panthera leo — typographie des noms latins" } },
  { unit:25, topic:"La Désinformation et les Fake News",           knowledge_focus:"Comment les fausses informations se propagent en ligne",    toefl_angle:"Les plateformes de réseaux sociaux devraient-elles être légalement responsables des fake news ?", grammar_point:"Les verbes de communication avec leurs constructions (accuser de, nier + infinitif)", conjugaison:{ verb:"diffuser", tense:"Présent + passé composé", focus:"Verbes de communication + constructions avec de + infinitif" }, orthographe:{ rule:"Les guillemets pour marquer la distance critique", focus:"Les soi-disant « experts » — guillemets de distanciation" } },
  { unit:26, topic:"L'Économie Spatiale",                          knowledge_focus:"Le voyage spatial commercial et ses implications",          toefl_angle:"Les ressources spatiales devraient-elles appartenir à des entreprises privées ?", grammar_point:"Le futur passif",                                             conjugaison:{ verb:"lancer",                tense:"Futur simple + futur passif",          focus:"Sera lancé, seront exploitées — futur passif et accord" },                        orthographe:{ rule:"Les acronymes spatiaux et scientifiques",                           focus:"NASA, ESA, ISS, CNES — majuscules, genre et accord" } },
  { unit:27, topic:"La Préservation des Langues",                  knowledge_focus:"Pourquoi les langues minoritaires disparaissent",           toefl_angle:"Les gouvernements devraient-ils financer des programmes pour sauver les langues en danger ?", grammar_point:"Les phrases clivées (C'est X qui… / C'est X que…)",       conjugaison:{ verb:"préserver",             tense:"Présent + passé composé",              focus:"Verbes de transmission culturelle + clivage pour l'emphase" },                    orthographe:{ rule:"Les noms de langues et leurs adjectifs dérivés",                   focus:"Le breton, le basque, l'occitan — minuscule pour les langues" } },
  { unit:28, topic:"L'Éthique du Génie Génétique",                 knowledge_focus:"CRISPR et les bébés génétiquement modifiés",               toefl_angle:"L'ingénierie génétique des humains devrait-elle être autorisée ?",   grammar_point:"Les modaux pour les situations hypothétiques",                conjugaison:{ verb:"modifier",              tense:"Conditionnel présent + passé",         focus:"Révision complète du conditionnel dans les débats éthiques" },                    orthographe:{ rule:"Les termes de biologie et de génétique",                            focus:"Chromosome, ADN, séquencer, génome — orthographe scientifique" } },
  { unit:29, topic:"La Réforme de la Politique sur les Drogues",   knowledge_focus:"Débats sur la dépénalisation et la légalisation",          toefl_angle:"Les drogues récréatives devraient-elles être légalisées et réglementées ?", grammar_point:"Les mots de liaison de cause et de résultat",              conjugaison:{ verb:"légaliser",             tense:"Présent + conditionnel",               focus:"Verbes de politique publique + liaisons causales" },                               orthographe:{ rule:"Les connecteurs logiques et leur ponctuation",                      focus:"Par conséquent, en revanche, c'est pourquoi — virgule et point-virgule" } },
  { unit:30, topic:"La Démocratie sous Pression",                  knowledge_focus:"Autoritarisme, populisme et recul démocratique",            toefl_angle:"La démocratie est-elle le meilleur système politique pour tous les pays ?", grammar_point:"Les propositions en quoi que, qui que, où que",           conjugaison:{ verb:"gouverner",             tense:"Présent + subjonctif",                 focus:"Quoi qu'il arrive, qui que ce soit — subjonctif obligatoire" },                   orthographe:{ rule:"Quoique vs quoi que, quelque vs quel que",                          focus:"Quoiqu'il soit tard vs quoi qu'il fasse — pièges orthographiques" } },
],

// ── B2 ────────────────────────────────────────────────────────────────────────
B2: [
  { unit:1,  topic:"L'Économie Comportementale",                  knowledge_focus:"Pourquoi les humains prennent des décisions irrationnelles", toefl_angle:"Les gouvernements devraient-ils utiliser des nudges comportementaux pour améliorer la santé publique ?", grammar_point:"L'inversion avec les adverbiaux négatifs (Jamais je n'ai…)", conjugaison:{ verb:"influencer",         tense:"Présent + subjonctif",                 focus:"Inversion stylistique avec adverbiaux négatifs en contexte formel" },             orthographe:{ rule:"La nominalisation — verbes et adjectifs transformés en noms",       focus:"Décider → la décision, rationnel → la rationalité" } },
  { unit:2,  topic:"L'Économie de l'Attention",                   knowledge_focus:"Comment les applications et plateformes se disputent votre concentration", toefl_angle:"Les entreprises tech devraient-elles être régulées pour leur design intentionnellement addictif ?", grammar_point:"Les phrases clivées (Il-clivé et Qu'est-ce que-clivé)", conjugaison:{ verb:"capter",             tense:"Présent + passif + subjonctif",        focus:"C'est l'attention qu'ils cherchent à capter — clivage et emphase" },             orthographe:{ rule:"Les guillemets et l'italique pour les termes techniques",           focus:"L'« économie de l'attention » — conventions typographiques" } },
  { unit:3,  topic:"La Croissance Post-Traumatique",              knowledge_focus:"Comment l'adversité peut mener à la force psychologique",  toefl_angle:"La souffrance peut-elle mener à un développement personnel significatif ?", grammar_point:"Les conditionnelles mixtes — maîtrise",                       conjugaison:{ verb:"surmonter",             tense:"Conditionnel présent + passé (mixte)", focus:"Si j'avais vécu cela, je serais différent aujourd'hui" },                          orthographe:{ rule:"Les préfixes psychologiques : psycho-, neuro-, socio-",             focus:"Psychologique, neurologique, sociologique — formation" } },
  { unit:4,  topic:"L'Avenir des Démocraties",                    knowledge_focus:"Menaces et résilience des institutions démocratiques",      toefl_angle:"La démocratie est-elle en déclin à l'échelle mondiale ?",             grammar_point:"Le subjonctif — contextes formels",                           conjugaison:{ verb:"préserver",             tense:"Subjonctif présent et passé",          focus:"Il faut que la démocratie survive — subjonctif complet" },                        orthographe:{ rule:"Le subjonctif passé — formation et orthographe",                    focus:"Qu'il ait compris, qu'elle soit venue — accords" } },
  { unit:5,  topic:"Les Neurosciences de l'Apprentissage",        knowledge_focus:"Comment le cerveau acquiert et retient l'information",      toefl_angle:"Les découvertes en neurosciences devraient-elles remodeler les programmes scolaires ?", grammar_point:"Les propositions participiales (participes parfaits et passifs)", conjugaison:{ verb:"consolider",       tense:"Participes présent et passé",          focus:"Ayant mémorisé / étant consolidé — participes parfaits et passifs" },             orthographe:{ rule:"L'accord du participe passé des verbes pronominaux",                focus:"Elle s'est souvenue / Ils se sont rappelé — règles complexes" } },
  { unit:6,  topic:"L'Éthique de la Surveillance",                knowledge_focus:"La surveillance gouvernementale et corporative des citoyens", toefl_angle:"La surveillance de masse est-elle jamais justifiée au nom de la sécurité ?", grammar_point:"Les structures emphatiques (c'est bien …, c'est effectivement …)", conjugaison:{ verb:"surveiller",       tense:"Présent + passif + emphatique",        focus:"C'est bien l'État qui surveille — emphase en français formel" },                  orthographe:{ rule:"Les termes juridiques liés à la vie privée",                        focus:"Données personnelles, consentement, traçabilité" } },
  { unit:7,  topic:"L'Histoire du Capitalisme",                   knowledge_focus:"Comment les économies de marché se sont développées",       toefl_angle:"Le capitalisme a-t-il créé plus de prospérité ou plus d'inégalités ?", grammar_point:"Le discours indirect avancé — modèles de verbes rapporteurs", conjugaison:{ verb:"affirmer",             tense:"Discours indirect + tous les temps",   focus:"Il a affirmé que… / Elle a contesté le fait que… — verbes variés" },             orthographe:{ rule:"Les guillemets dans les citations académiques",                     focus:"Selon Marx, « le capital est… » — conventions de citation" } },
  { unit:8,  topic:"Les Droits à la Vie Privée Numérique",        knowledge_focus:"Qui possède vos données et comment elles sont utilisées",    toefl_angle:"La vie privée des données devrait-elle être un droit humain fondamental ?", grammar_point:"Les modaux de spéculation (passé, présent, futur)",       conjugaison:{ verb:"collecter",             tense:"Conditionnel présent et passé",        focus:"Ils pourraient avoir accès / Ils auraient pu collecter" },                        orthographe:{ rule:"Le RGPD et le vocabulaire de la protection des données",            focus:"Consentement explicite, données sensibles, responsable de traitement" } },
  { unit:9,  topic:"La Philosophie du Bonheur",                   knowledge_focus:"Le bien-être hédonique vs eudémonique",                    toefl_angle:"La recherche du bonheur est-elle un objectif de vie valable ?",        grammar_point:"Le langage d'atténuation (il semble que, tend à, pourrait suggérer)", conjugaison:{ verb:"s'épanouir",         tense:"Présent + subjonctif + conditionnel",  focus:"Il semble que le bonheur soit subjectif — atténuation + subjonctif" },           orthographe:{ rule:"Les termes philosophiques d'origine grecque et latine",             focus:"Eudémonie, hédonisme, utilitarisme — orthographe" } },
  { unit:10, topic:"Les Chaînes d'Approvisionnement Mondiales",   knowledge_focus:"Comment la production mondiale crée des vulnérabilités",    toefl_angle:"Les pays devraient-ils privilégier l'autosuffisance au commerce mondial ?", grammar_point:"Le passif avec des verbes de rapport (Il est dit que…)",   conjugaison:{ verb:"approvisionner",        tense:"Présent + passif impersonnel",         focus:"Il est estimé que / On rapporte que — passif impersonnel" },                      orthographe:{ rule:"Les latinismes dans le discours académique",                        focus:"A priori, a posteriori, in fine, de facto — orthographe et italique" } },
  { unit:11, topic:"La Psychologie des Préjugés",                 knowledge_focus:"Comment les biais se forment et se renforcent",             toefl_angle:"L'éducation seule peut-elle éliminer les préjugés ?",                  grammar_point:"Les conjonctions de contraste (tandis que, alors que, en revanche)", conjugaison:{ verb:"renforcer",           tense:"Présent + passé composé + conditionnel", focus:"Révision avec conjonctions de contraste intégrées" },                           orthographe:{ rule:"Les préfixes négatifs dans le vocabulaire académique",              focus:"Atypique, anticonformiste, déstabiliser, inconscient" } },
  { unit:12, topic:"La Résistance aux Antibiotiques",             knowledge_focus:"Comment la surutilisation menace la santé mondiale",        toefl_angle:"Qui devrait être responsable de la résistance aux antibiotiques ?",    grammar_point:"L'inversion conditionnelle (Si j'étais → Étais-je…)",        conjugaison:{ verb:"résister",              tense:"Subjonctif imparfait (introduction)",   focus:"Eût-il résisté / L'eût-on traité — formes littéraires" },                        orthographe:{ rule:"Le subjonctif imparfait — terminaisons et reconnaissance",          focus:"-asse, -isse, -usse et formes en eût/fût — pour la lecture" } },
  { unit:13, topic:"L'Avenir de l'Enseignement Supérieur",        knowledge_focus:"Apprentissage en ligne, coûts et pertinence des diplômes",  toefl_angle:"Un diplôme universitaire vaut-il encore l'investissement ?",          grammar_point:"Les propositions adverbiales de temps — avancées",            conjugaison:{ verb:"se former",             tense:"Futur simple + futur antérieur",        focus:"Une fois qu'il aura obtenu son diplôme — séquences temporelles" },                orthographe:{ rule:"Les abréviations universitaires et leurs points",                   focus:"M., Mme, Dr, Pr, cf., op. cit. — conventions académiques" } },
  { unit:14, topic:"Géopolitique et Puissance Mondiale",          knowledge_focus:"Comment les nations se disputent l'influence",              toefl_angle:"Une nouvelle guerre froide entre les États-Unis et la Chine est-elle inévitable ?", grammar_point:"Les propositions concessives (bien que, même si, quand même)", conjugaison:{ verb:"rivaliser",           tense:"Présent + subjonctif + conditionnel",  focus:"Bien qu'ils rivalisent, ils s'allient — concession + subjonctif" },              orthographe:{ rule:"Les noms de pays, de régimes et d'alliances",                       focus:"L'Union européenne, l'OTAN, le G20 — majuscules et articles" } },
  { unit:15, topic:"La Science de l'Addiction",                   knowledge_focus:"Chimie du cerveau et dépendance",                          toefl_angle:"L'addiction devrait-elle être traitée comme une condition médicale ?", grammar_point:"Les verbes à particules — avancés et multi-mots",             conjugaison:{ verb:"se rétablir",           tense:"Présent + passé composé + conditionnel", focus:"Verbes pronominaux complexes en contexte médical" },                           orthographe:{ rule:"Les termes médicaux et neurologiques avancés",                      focus:"Neurotransmetteur, dopaminergique, synaptique — orthographe" } },
  { unit:16, topic:"Le Développement Durable",                    knowledge_focus:"Équilibrer la croissance avec les limites environnementales", toefl_angle:"La croissance économique peut-elle jamais être véritablement durable ?", grammar_point:"Être censé / être supposé + infinitif",                      conjugaison:{ verb:"développer",            tense:"Présent + conditionnel + passif",       focus:"Ce projet est censé réduire / Nous sommes supposés agir" },                       orthographe:{ rule:"Les sigles environnementaux et leurs expansions",                   focus:"CO2, ODD, COP, GES — orthographe et prononciation" } },
  { unit:17, topic:"Le Biais Algorithmique",                      knowledge_focus:"Comment les systèmes d'IA reproduisent les préjugés",       toefl_angle:"Les systèmes d'IA utilisés dans le recrutement devraient-ils être audités ?", grammar_point:"Les propositions relatives avancées (quantificateurs + lequel/dont/duquel)", conjugaison:{ verb:"discriminer",      tense:"Présent + passif + subjonctif",        focus:"Le système par lequel / les données grâce auxquelles" },                          orthographe:{ rule:"Les formes de lequel : auquel, duquel, desquelles",                 focus:"À laquelle, auxquels, desquels — contractions et accords" } },
  { unit:18, topic:"L'Éthique de la Richesse",                    knowledge_focus:"Philanthropie, héritage et obligations morales des riches",  toefl_angle:"Les milliardaires devraient-ils exister dans un monde avec une pauvreté extrême ?", grammar_point:"Les verbes suivis de -ing ou de l'infinitif avec changement de sens", conjugaison:{ verb:"léguer",            tense:"Présent + passé composé + conditionnel", focus:"Révision des constructions verbales complexes en contexte économique" },        orthographe:{ rule:"Les termes financiers et économiques",                              focus:"Philanthropie, redistribution, patrimoine, plus-value" } },
  { unit:19, topic:"Le Débat sur l'Énergie Nucléaire",            knowledge_focus:"Risques et avantages de l'énergie nucléaire",               toefl_angle:"L'énergie nucléaire devrait-elle faire partie de la solution au changement climatique ?", grammar_point:"Les formes continues modales (doit être en train de)",     conjugaison:{ verb:"produire",              tense:"Présent continu modal",                focus:"Ils doivent être en train de traiter / Le réacteur devrait fonctionner" },         orthographe:{ rule:"Les unités de mesure nucléaires et énergétiques",                   focus:"Kilowatt-heure (kWh), becquerel (Bq), sievert (Sv)" } },
  { unit:20, topic:"Les Migrations Humaines",                     knowledge_focus:"Migrations massives historiques et modernes",               toefl_angle:"Une politique d'immigration ouverte est-elle économiquement bénéfique ?", grammar_point:"Les marqueurs de discours (de plus, néanmoins, par conséquent)", conjugaison:{ verb:"émigrer",             tense:"Présent + passé composé + conditionnel", focus:"Verbes de mouvement et d'intégration + marqueurs de discours" },               orthographe:{ rule:"Les marqueurs de discours et leur ponctuation",                     focus:"Cependant, en outre, par ailleurs — virgules et positions" } },
  { unit:21, topic:"La Philosophie de l'Éducation",               knowledge_focus:"À quoi sert l'éducation — savoir, citoyenneté ou emploi",   toefl_angle:"L'éducation devrait-elle former de bons citoyens ou des travailleurs qualifiés ?", grammar_point:"La nominalisation — transformer les verbes et adjectifs en noms", conjugaison:{ verb:"former",             tense:"Présent + passif + nominalisation",    focus:"La formation des citoyens — style nominalisé formel" },                           orthographe:{ rule:"Le style nominalisé dans l'écriture académique",                    focus:"On a réformé → la réforme de / On a analysé → l'analyse de" } },
  { unit:22, topic:"Les Biais Cognitifs dans la Prise de Décision", knowledge_focus:"Les raccourcis mentaux et leurs conséquences",            toefl_angle:"La formation aux biais cognitifs devrait-elle être obligatoire à l'école ?", grammar_point:"L'inversion négative (Non seulement … mais aussi)",       conjugaison:{ verb:"biaiser",               tense:"Présent + passif",                     focus:"Emploi de biaiser et ses constructions" },                                        orthographe:{ rule:"Les termes de la cognition (heuristique, ancrage, dissonance)",     focus:"Heuristique, ancrage, dissonance cognitive — orthographe" } },
  { unit:23, topic:"L'Éthique de la Consommation de Viande",      knowledge_focus:"Dimensions environnementales, éthiques et sanitaires",      toefl_angle:"Les gouvernements devraient-ils décourager activement la consommation de viande ?", grammar_point:"Le futur dans le passé (allait, aurait)",                  conjugaison:{ verb:"consommer",             tense:"Conditionnel présent + imparfait",      focus:"Emploi du conditionnel et imparfait pour le futur dans le passé" },               orthographe:{ rule:"Les mots liés à l'éthique alimentaire (végétarisme, véganisme)",    focus:"Végétalien, végétarien, végan — orthographe et différences" } },
  { unit:24, topic:"L'Impérialisme Culturel",                     knowledge_focus:"Comment les cultures dominantes écrasent les plus petites",  toefl_angle:"La mondialisation menace-t-elle la diversité culturelle ?",            grammar_point:"Les propositions conditionnelles sans si (pourvu que, à condition de, à moins que)", conjugaison:{ verb:"imposer",        tense:"Présent + passif",                     focus:"Emploi transitif et pronominal de s'imposer" },                                   orthographe:{ rule:"Les termes postcoloniaux (hybridité, soft power, diaspora)",        focus:"Genre et orthographe des emprunts postcoloniaux" } },
  { unit:25, topic:"La Théorie du Contrat Social",                 knowledge_focus:"Rousseau, Locke, Hobbes — ce que nous nous devons",         toefl_angle:"Le contrat social est-il encore pertinent au 21e siècle ?",            grammar_point:"Le passé hypothétique (Si seulement…, Je souhaite que… eût)", conjugaison:{ verb:"consentir",             tense:"Subjonctif présent + passé",           focus:"Conjugaison et emploi de consentir au subjonctif" },                              orthographe:{ rule:"Les noms des philosophes et courants philosophiques",               focus:"Le rousseauisme, le lockéisme — conventions d'écriture" } },
  { unit:26, topic:"Les Dark Patterns dans la Technologie",        knowledge_focus:"La conception manipulatrice dans les produits numériques",   toefl_angle:"Les gouvernements devraient-ils réguler la conception UX manipulatrice ?", grammar_point:"Le discours rapporté à l'infinitif (on lui a dit de, on lui a demandé de)", conjugaison:{ verb:"tromper",          tense:"Présent + infinitif passé",            focus:"Emploi de tromper et se laisser tromper" },                                       orthographe:{ rule:"Les termes UX et du design (interface, manipulation, déceptif)",    focus:"Orthographe des termes du design trompeur" } },
  { unit:27, topic:"La Gouvernance Mondiale de la Santé",          knowledge_focus:"OMS, pandémies et coopération sanitaire internationale",    toefl_angle:"Devrait-il y avoir un accord mondial contraignant sur la préparation aux pandémies ?", grammar_point:"Les articles en contextes abstraits et génériques",         conjugaison:{ verb:"coordonner",            tense:"Présent + subjonctif",                 focus:"Emploi du subjonctif avec il est crucial que" },                                  orthographe:{ rule:"Les termes de la santé mondiale (pandémie, épidémie, endémie)",    focus:"Distinction pandémie/épidémie, orthographe" } },
  { unit:28, topic:"Le Rôle de l'Art dans la Société",             knowledge_focus:"L'art comme résistance, identité et commentaire social",    toefl_angle:"Les gouvernements devraient-ils financer les arts ?",                  grammar_point:"L'emphase avec les auxiliaires (c'est bien lui qui, c'est effectivement)", conjugaison:{ verb:"subvertir",           tense:"Présent + passé composé",              focus:"Conjugaison de subvertir (3e groupe)" },                                          orthographe:{ rule:"Les termes de la critique artistique (esthétique, subversif)",      focus:"Esthétique, subversif, avant-garde — orthographe" } },
  { unit:29, topic:"La Décroissance Économique",                   knowledge_focus:"L'argument pour une réduction délibérée des économies",     toefl_angle:"La décroissance est-elle une solution réaliste à la destruction environnementale ?", grammar_point:"Les structures causatives avancées (passif causatif)",      conjugaison:{ verb:"décroître",             tense:"Présent",                              focus:"Conjugaison irrégulière de décroître" },                                          orthographe:{ rule:"Les termes de la décroissance (sobriété, convivialité)",            focus:"Sobriété, convivialité, post-croissance — orthographe" } },
  { unit:30, topic:"L'Éthique de la Mémoire et de l'Histoire",     knowledge_focus:"Comment les nations se souviennent des passés difficiles",  toefl_angle:"Les statues de personnages historiques controversés devraient-elles être retirées ?", grammar_point:"La cohésion du discours (substitution, ellipse, référence)", conjugaison:{ verb:"commémorer",           tense:"Présent + passif",                     focus:"Emploi actif et passif de commémorer" },                                          orthographe:{ rule:"Les termes de la mémoire et de l'histoire",                         focus:"Commémoration, réconciliation, justice transitionnelle" } },
],

}; // end UNITS

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function pad(n, width) {
  return String(n).padStart(width, '0');
}

// Fix literal control chars and bad escape sequences inside JSON string values.
function sanitizeJson(str) {
  let out = '';
  let inStr = false;
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (inStr) {
      if (ch === '\\') {
        const next = str[i + 1];
        if (next !== undefined && '"\\/bfnrtuv'.includes(next)) {
          out += ch + next; i += 2;
        } else {
          out += '\\\\'; i++;
        }
      } else if (ch === '"') {
        inStr = false; out += ch; i++;
      } else if (ch === '\n') { out += '\\n';  i++;
      } else if (ch === '\r') { out += '\\r';  i++;
      } else if (ch === '\t') { out += '\\t';  i++;
      } else if (ch.charCodeAt(0) < 0x20) { i++; // drop other control chars
      } else { out += ch; i++; }
    } else {
      if (ch === '"') inStr = true;
      out += ch; i++;
    }
  }
  return out;
}

async function apiCall(userPrompt) {
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model:       'deepseek-v4-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userPrompt     },
      ],
      temperature: 0.7,
      max_tokens:  16384,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }

  const data    = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  const clean   = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    return JSON.parse(sanitizeJson(clean));
  }
}

async function callWithRetry(prompt, validateFn, label) {
  await sleep(DELAY_MS);
  let result;
  try {
    result = await apiCall(prompt);
  } catch (e) {
    console.warn(`    ⚠ API error on first attempt (${label}): ${e.message}`);
    await sleep(DELAY_MS);
    result = await apiCall(prompt);
  }

  if (validateFn(result)) return result;

  console.warn(`    ⚠ Validation failed for ${label}, retrying…`);
  await sleep(DELAY_MS);
  const retry = await apiCall(prompt);
  if (validateFn(retry)) return retry;

  console.error(`    ✗ Validation still failed after retry (${label}). Saving raw result.`);
  return retry;
}

// ─── VALIDATORS ───────────────────────────────────────────────────────────────

function validGrammar(r) {
  return r && typeof r.explanationMarkdown === 'string' &&
    Array.isArray(r.examples) && r.examples.length === 5 &&
    r.examples.every(e => typeof e === 'string');
}

function validConjugaison(r) {
  if (!r || typeof r.verb !== 'string' || typeof r.tense !== 'string') return false;
  if (!Array.isArray(r.conjugationTable) || r.conjugationTable.length !== 6) return false;
  if (!r.conjugationTable.every(row => typeof row.pronoun === 'string' && typeof row.form === 'string')) return false;
  if (r.irregularNotes !== null && typeof r.irregularNotes !== 'string') return false;
  if (!Array.isArray(r.exercises) || r.exercises.length !== 10) return false;
  const validTypes = ['fill_conjugation','choose_correct_form','transform_tense','error_correction'];
  return r.exercises.every(e =>
    typeof e.id === 'string' &&
    validTypes.includes(e.type) &&
    typeof e.instruction === 'string' &&
    typeof e.question === 'string' &&
    typeof e.answer === 'string' &&
    typeof e.explanation === 'string'
  );
}

function validOrthographe(r) {
  if (!r || typeof r.rule !== 'string' || typeof r.explanationMarkdown !== 'string') return false;
  if (!Array.isArray(r.examples) || r.examples.length !== 5) return false;
  if (!Array.isArray(r.exercises) || r.exercises.length !== 10) return false;
  const validTypes = ['correct_the_spelling','choose_correct_spelling','fill_accent','gender_agreement'];
  return r.exercises.every(e =>
    typeof e.id === 'string' &&
    validTypes.includes(e.type) &&
    typeof e.instruction === 'string' &&
    typeof e.question === 'string' &&
    typeof e.answer === 'string' &&
    typeof e.explanation === 'string'
  );
}

function validVocabulary(r, expectedLength) {
  if (!r || !Array.isArray(r.vocabulary)) return false;
  if (r.vocabulary.length !== expectedLength) return false;
  const validPOS = ['noun','verb','adjective','adverb','preposition','conjunction','pronoun','other'];
  return r.vocabulary.every(v =>
    typeof v.word === 'string' &&
    typeof v.cefrLevel === 'string' &&
    validPOS.includes(v.partOfSpeech) &&
    (v.gender === 'm' || v.gender === 'f' || v.gender === null) &&
    typeof v.phonetics === 'string' &&
    typeof v.arabicTranslation === 'string' &&
    typeof v.exampleSentence === 'string'
  );
}

function validReading(r) {
  if (!r || typeof r.title !== 'string' || typeof r.passage !== 'string') return false;
  if (typeof r.wordCount !== 'number' || !Number.isInteger(r.wordCount)) return false;
  if (!Array.isArray(r.questions) || r.questions.length !== 5) return false;
  return r.questions.every((q, i) =>
    q.id === `Q${i + 1}` &&
    typeof q.question === 'string' &&
    q.options && typeof q.options.a === 'string' && typeof q.options.b === 'string' &&
    typeof q.options.c === 'string' && typeof q.options.d === 'string' &&
    ['a','b','c','d'].includes(q.correct) &&
    typeof q.explanation === 'string'
  );
}

function validListening(r) {
  if (!r || typeof r.title !== 'string') return false;
  if (!Array.isArray(r.speakers) || r.speakers.length !== 2) return false;
  if (r.speakers[0].key !== 'A' || r.speakers[1].key !== 'B') return false;
  if (!Array.isArray(r.dialogue) || r.dialogue.length < 10) return false;
  if (!r.dialogue.every((d, i) => d.turn === i + 1 && d.speaker === (i % 2 === 0 ? 'A' : 'B') && typeof d.line === 'string')) return false;
  if (!Array.isArray(r.questions) || r.questions.length !== 5) return false;
  return r.questions.every((q, i) =>
    q.id === `L${i + 1}` &&
    typeof q.question === 'string' &&
    q.options && ['a','b','c','d'].includes(q.correct)
  );
}

function validWriting(r) {
  if (!r || typeof r.prompt !== 'string') return false;
  if (typeof r.minWords !== 'number' || typeof r.maxWords !== 'number') return false;
  if (!r.rubric || typeof r.rubric.taskResponse !== 'string') return false;
  if (typeof r.rubric.coherence !== 'string' || typeof r.rubric.vocabulary !== 'string' || typeof r.rubric.grammar !== 'string') return false;
  return Array.isArray(r.suggestedVocab) && r.suggestedVocab.length === 8 &&
    r.suggestedVocab.every(w => typeof w === 'string');
}

function validSpeaking(r) {
  if (!r || !Array.isArray(r.questions) || r.questions.length !== 10) return false;
  if (!r.questions.every((q, i) =>
    q.order === i + 1 &&
    ['personal','description','opinion','comparison','hypothetical'].includes(q.category) &&
    typeof q.question === 'string' &&
    q.thinkSeconds === 30 &&
    typeof q.speakSeconds === 'number'
  )) return false;
  const cats = r.questions.map(q => q.category);
  return cats.filter(c => c === 'personal').length === 3 &&
    cats.filter(c => c === 'description').length === 2 &&
    cats.filter(c => c === 'opinion').length === 2 &&
    cats.filter(c => c === 'comparison').length === 2 &&
    cats.filter(c => c === 'hypothetical').length === 1;
}

function validReview(r) {
  if (!r || !Array.isArray(r.exercises) || r.exercises.length !== 13) return false;
  if (!r.exercises.every((e, i) => e.id === `RV${i + 1}`)) return false;
  const validTypes = [
    'vocabulary_choice','vocabulary_definition','odd_one_out',
    'fill_in_the_blank','error_correction','comprehension_recall',
    'sentence_transformation','multiple_choice_grammar',
  ];
  if (!r.exercises.every(e => validTypes.includes(e.exercise.type))) return false;
  const recalls = r.exercises.filter(e => e.exercise.type === 'comprehension_recall');
  if (recalls.length !== 2) return false;
  if (!recalls.some(e => e.exercise.source === 'reading')) return false;
  if (!recalls.some(e => e.exercise.source === 'listening')) return false;
  for (const e of r.exercises.filter(ex => ex.exercise.type === 'multiple_choice_grammar')) {
    if (typeof e.exercise.options !== 'object' || Array.isArray(e.exercise.options)) return false;
    if (!['a','b','c','d'].includes(e.exercise.correct)) return false;
  }
  return true;
}

// ─── PROMPT BUILDERS ──────────────────────────────────────────────────────────

function buildGrammarPrompt(lvl, unit, words) {
  return `Generate a French grammar module for a ${lvl} learner.
Topic: ${unit.topic}
Grammar point: ${unit.grammar_point}
Return a JSON object with EXACTLY this structure — every field required, no extras:
{
"explanationMarkdown": "string — explanation of the grammar point in simple English. Include: the rule, formation pattern, and 2-3 common mistakes. Use markdown bold and bullet points. 200-300 words.",
"examples": [
"string — complete French sentence using the grammar point with topic vocabulary",
"string",
"string",
"string",
"string"
]
}
The examples array must contain EXACTLY 5 strings. Each string is a complete French sentence. Sentences progress from simple to more complex.`;
}

function buildConjugaisonPrompt(lvl, unit) {
  return `Generate a French conjugation module for a ${lvl} learner.
Topic: ${unit.topic}
Verb: ${unit.conjugaison.verb}
Tense: ${unit.conjugaison.tense}
Focus: ${unit.conjugaison.focus}
Return a JSON object with EXACTLY this structure — every field required, no extras:
{
"verb": "string — the verb as given",
"tense": "string — the tense as given",
"conjugationTable": [
{ "pronoun": "je", "form": "string" },
{ "pronoun": "tu", "form": "string" },
{ "pronoun": "il/elle/on", "form": "string" },
{ "pronoun": "nous", "form": "string" },
{ "pronoun": "vous", "form": "string" },
{ "pronoun": "ils/elles", "form": "string" }
],
"irregularNotes": "string or null — explain irregularities, or null if fully regular",
"exercises": [ ...exactly 10 exercise objects... ]
}
The conjugationTable array must contain EXACTLY 6 objects in the order shown above.
The exercises array must contain EXACTLY 10 objects.
Each exercise object must use ONE of these four exact shapes:
TYPE "fill_conjugation": { "id": "C1", "type": "fill_conjugation", "instruction": "string", "question": "string with _____", "options": null, "answer": "string", "explanation": "string" }
TYPE "choose_correct_form": { "id": "C2", "type": "choose_correct_form", "instruction": "string", "question": "string", "options": ["string","string","string","string"], "answer": "string — must match one option", "explanation": "string" }
TYPE "transform_tense": { "id": "C3", "type": "transform_tense", "instruction": "string", "question": "string", "options": null, "answer": "string", "explanation": "string" }
TYPE "error_correction": { "id": "C4", "type": "error_correction", "instruction": "string", "question": "string", "options": null, "answer": "string", "explanation": "string" }
Exercise distribution: 3 fill_conjugation, 3 choose_correct_form, 2 transform_tense, 2 error_correction.
IDs must be C1 through C10 in order.
All sentences must relate to the topic: ${unit.topic}.`;
}

function buildOrthographePrompt(lvl, unit) {
  return `Generate a French orthography module for a ${lvl} learner.
Topic: ${unit.topic}
Spelling rule: ${unit.orthographe.rule}
Focus: ${unit.orthographe.focus}
Return a JSON object with EXACTLY this structure — every field required, no extras:
{
"rule": "string — the rule name as given",
"explanationMarkdown": "string — clear explanation of the spelling rule. State the core rule, give 3 concrete examples. 150-200 words. Use markdown.",
"examples": ["string","string","string","string","string"],
"exercises": [ ...exactly 10 exercise objects... ]
}
The examples array must contain EXACTLY 5 strings.
The exercises array must contain EXACTLY 10 objects.
Each exercise object must use ONE of these exact shapes:
TYPE "correct_the_spelling": { "id": "O1", "type": "correct_the_spelling", "instruction": "string", "question": "string", "options": null, "answer": "string", "explanation": "string" }
TYPE "choose_correct_spelling": { "id": "O2", "type": "choose_correct_spelling", "instruction": "string", "question": "string", "options": ["string","string","string","string"], "answer": "string", "explanation": "string" }
TYPE "fill_accent": { "id": "O3", "type": "fill_accent", "instruction": "string", "question": "string", "options": null, "answer": "string", "explanation": "string" }
TYPE "gender_agreement": { "id": "O4", "type": "gender_agreement", "instruction": "string", "question": "string", "options": ["string","string","string","string"], "answer": "string", "explanation": "string" }
Exercise distribution: 3 correct_the_spelling, 3 choose_correct_spelling, 2 fill_accent, 2 gender_agreement.
IDs must be O1 through O10 in order.`;
}

function buildVocabPrompt(lvl, unit, wordList) {
  return `Generate vocabulary entries for a French ${lvl} learner.
Topic: ${unit.topic}
Words to process: ${wordList.join(', ')}
Return a JSON object with EXACTLY this structure:
{
"vocabulary": [ ...one object per word... ]
}
Each word object must have EXACTLY this shape — every field required, no extras:
{
"word": "string — the word exactly as given",
"cefrLevel": "string — exactly ${lvl}",
"partOfSpeech": "string — one of: noun, verb, adjective, adverb, preposition, conjunction, pronoun, other",
"gender": "string or null — exactly 'm' for masculine, 'f' for feminine, null for non-nouns",
"phonetics": "string — IPA transcription of the word",
"arabicTranslation": "string — accurate Modern Standard Arabic translation",
"exampleSentence": "string — one natural French sentence using this word in the context of '${unit.topic}'. Maximum 12 words."
}
The vocabulary array must contain exactly ${wordList.length} objects where N equals the number of words given.
Every word from the input list must appear exactly once.`;
}

function buildReadingPrompt(lvl, unit, top15) {
  return `Generate a French reading passage for a ${lvl} learner.
Topic: ${unit.topic}
Knowledge focus: ${unit.knowledge_focus}
Grammar point: ${unit.grammar_point}
Vocabulary to weave in naturally (use at least 10): ${top15.join(', ')}
Target word count: ${WORD_COUNT[lvl]} words
CRITICAL RULE — the passage is about the TOPIC, not about the grammar:
If the grammar point is a core tense or mood: write the entire passage using that tense/mood naturally.
If the grammar point is a minor point (articles, pronouns, prepositions, demonstratives): write naturally about the topic and include the grammar point organically without making it the focus.
Return a JSON object with EXACTLY this structure — every field required, no extras:
{
"title": "string — short engaging title in French, 4-7 words",
"passage": "string — the complete passage text",
"wordCount": number — integer count of words in the passage,
"questions": [
{ "id": "Q1", "question": "string", "options": { "a": "string", "b": "string", "c": "string", "d": "string" }, "correct": "string — exactly one of: a, b, c, d", "explanation": "string" },
{ "id": "Q2", "question": "string", "options": { "a": "string", "b": "string", "c": "string", "d": "string" }, "correct": "string", "explanation": "string" },
{ "id": "Q3", "question": "string", "options": { "a": "string", "b": "string", "c": "string", "d": "string" }, "correct": "string", "explanation": "string" },
{ "id": "Q4", "question": "string", "options": { "a": "string", "b": "string", "c": "string", "d": "string" }, "correct": "string", "explanation": "string" },
{ "id": "Q5", "question": "string", "options": { "a": "string", "b": "string", "c": "string", "d": "string" }, "correct": "string", "explanation": "string" }
]
}
The questions array must contain EXACTLY 5 objects with ids Q1 through Q5.
Every question must be answerable from the passage text only.
The options object must always contain exactly the keys a, b, c, d.
The correct field must be exactly 'a', 'b', 'c', or 'd'.`;
}

function buildListeningPrompt(lvl, unit, top12) {
  return `Generate a French listening dialogue for a ${lvl} learner.
Topic: ${unit.topic}
Knowledge focus: ${unit.knowledge_focus}
Grammar point: ${unit.grammar_point}
Vocabulary to weave in naturally (use at least 8): ${top12.join(', ')}
Target turns: ${DIAL_TURNS[lvl]} turns
CRITICAL RULE — the dialogue is a real conversation about the TOPIC, not a grammar drill:
If the grammar point is a core tense or mood: the conversation naturally uses that tense/mood.
If the grammar point is a minor point: have a natural conversation about the topic.
Return a JSON object with EXACTLY this structure — every field required, no extras:
{
"title": "string — dialogue title in French",
"speakers": [
{ "key": "A", "name": "string — French female first name" },
{ "key": "B", "name": "string — French male first name" }
],
"dialogue": [
{ "turn": 1, "speaker": "A", "line": "string" },
{ "turn": 2, "speaker": "B", "line": "string" }
],
"questions": [
{ "id": "L1", "question": "string", "options": { "a": "string", "b": "string", "c": "string", "d": "string" }, "correct": "string", "explanation": "string" },
{ "id": "L2", "question": "string", "options": { "a": "string", "b": "string", "c": "string", "d": "string" }, "correct": "string", "explanation": "string" },
{ "id": "L3", "question": "string", "options": { "a": "string", "b": "string", "c": "string", "d": "string" }, "correct": "string", "explanation": "string" },
{ "id": "L4", "question": "string", "options": { "a": "string", "b": "string", "c": "string", "d": "string" }, "correct": "string", "explanation": "string" },
{ "id": "L5", "question": "string", "options": { "a": "string", "b": "string", "c": "string", "d": "string" }, "correct": "string", "explanation": "string" }
]
}
The speakers array must contain EXACTLY 2 objects with keys 'A' and 'B'.
The dialogue array turn numbers must be sequential integers starting at 1. Speaker must alternate A/B.
The questions array must contain EXACTLY 5 objects with ids L1 through L5.`;
}

function buildWritingPrompt(lvl, unit, top15) {
  return `Generate a French writing module for a ${lvl} learner.
Topic: ${unit.topic}
Discussion angle: ${unit.toefl_angle}
Grammar point to encourage: ${unit.grammar_point}
Unit vocabulary (suggest the most relevant): ${top15.join(', ')}
Return a JSON object with EXACTLY this structure — every field required, no extras:
{
"prompt": "string — writing prompt in French. 2-3 sentences. State the task clearly and provide 2 guiding questions. Vocabulary appropriate for ${lvl}.",
"minWords": ${WRITE_MIN[lvl]},
"maxWords": ${WRITE_MAX[lvl]},
"rubric": {
"taskResponse": "string — what good task response looks like at ${lvl} for this prompt",
"coherence": "string — what good coherence and organization looks like at ${lvl}",
"vocabulary": "string — what good vocabulary use looks like for this topic at ${lvl}",
"grammar": "string — what correct use of '${unit.grammar_point}' looks like in this response"
},
"suggestedVocab": ["string","string","string","string","string","string","string","string"]
}
The suggestedVocab array must contain EXACTLY 8 strings, each being a single word from the unit vocabulary list.
The rubric object must contain exactly the four keys: taskResponse, coherence, vocabulary, grammar.
The minWords must be exactly ${WRITE_MIN[lvl]} and maxWords must be exactly ${WRITE_MAX[lvl]}.`;
}

function buildSpeakingPrompt(lvl, unit) {
  return `Generate speaking questions for a French ${lvl} learner.
Topic: ${unit.topic}
Discussion angle: ${unit.toefl_angle}
Return a JSON object with EXACTLY this structure:
{
"questions": [
{
"order": number — integer 1 through 10,
"category": "string — exactly one of: personal, description, opinion, comparison, hypothetical",
"question": "string — question in French appropriate for ${lvl} learner",
"thinkSeconds": 30,
"speakSeconds": ${SPEAK_SECS[lvl]}
}
]
}
The questions array must contain EXACTLY 10 objects.
The order field must be sequential integers 1 through 10.
Category distribution must be EXACTLY: 3 personal, 2 description, 2 opinion, 2 comparison, 1 hypothetical.
Questions must progress from easiest (personal) to hardest (hypothetical).
thinkSeconds must always be exactly 30.
speakSeconds must be exactly ${SPEAK_SECS[lvl]}.
All questions must be in French.`;
}

function buildReviewPrompt(lvl, unit, top20) {
  return `Generate review exercises for a French ${lvl} unit.
Topic: ${unit.topic}
Grammar covered: ${unit.grammar_point}
Conjugation covered: ${unit.conjugaison.verb} — ${unit.conjugaison.tense}
Spelling rule covered: ${unit.orthographe.rule}
Unit vocabulary (use these words in exercises): ${top20.join(', ')}
Return a JSON object with EXACTLY this structure:
{
"exercises": [ ...exactly 13 exercise objects... ]
}
The exercises array must contain EXACTLY 13 objects in this order:
Positions 1-3: vocabulary exercises (types: vocabulary_choice, vocabulary_definition, odd_one_out)
Positions 4-6: grammar exercises (types: fill_in_the_blank, multiple_choice_grammar)
Positions 7-8: conjugation exercises targeting ${unit.conjugaison.verb} (type: fill_in_the_blank)
Positions 9-10: spelling exercises targeting ${unit.orthographe.rule} (type: error_correction)
Positions 11-12: comprehension recall (type: comprehension_recall, one source: reading, one source: listening)
Position 13: sentence transformation (type: sentence_transformation)

Each exercise object must follow one of these shapes (id must be RV1 through RV13 in order):
TYPE "vocabulary_choice": { "id": "RV1", "instruction": "string", "exercise": { "type": "vocabulary_choice", "sentence": "string with _____", "options": ["string","string","string","string"], "correct": "string", "explanation": "string" } }
TYPE "vocabulary_definition": { "id": "RV2", "instruction": "string", "exercise": { "type": "vocabulary_definition", "word": "string", "options": ["string","string","string","string"], "correct": "string", "explanation": "string" } }
TYPE "odd_one_out": { "id": "RV3", "instruction": "string", "exercise": { "type": "odd_one_out", "words": ["string","string","string","string"], "correct": "string", "explanation": "string" } }
TYPE "fill_in_the_blank": { "id": "RV4", "instruction": "string", "exercise": { "type": "fill_in_the_blank", "sentence": "string with _____", "options": ["string","string","string","string"] or null, "answer": "string", "explanation": "string" } }
TYPE "multiple_choice_grammar": { "id": "RV5", "instruction": "string", "exercise": { "type": "multiple_choice_grammar", "sentence": "string or null", "options": { "a": "string", "b": "string", "c": "string", "d": "string" }, "correct": "string — exactly one of: a, b, c, d", "explanation": "string" } }
TYPE "error_correction": { "id": "RV9", "instruction": "string", "exercise": { "type": "error_correction", "incorrect": "string", "correct": "string", "explanation": "string" } }
TYPE "comprehension_recall": { "id": "RV11", "instruction": "string", "exercise": { "type": "comprehension_recall", "source": "string — exactly 'reading' or 'listening'", "question": "string", "options": ["string","string","string","string"], "correct": "string", "explanation": "string" } }
TYPE "sentence_transformation": { "id": "RV13", "instruction": "string", "exercise": { "type": "sentence_transformation", "original": "string", "prompt": "string or null", "answer": "string", "explanation": "string" } }
CRITICAL: For multiple_choice_grammar, options must be an OBJECT with keys a, b, c, d — NOT an array.
IDs must be RV1 through RV13 in order.`;
}

// ─── UNIT GENERATION ──────────────────────────────────────────────────────────

async function generateUnit(lvl, unitDef, unitNum, totalUnits, vocabMap, fixNulls = false) {
  const unitKey  = `unit-${pad(unitNum, 2)}`;
  const outDir   = path.join(OUTPUT_BASE, lvl.toLowerCase());
  const outFile  = path.join(outDir, `${unitKey}.json`);

  const wordList = vocabMap[unitKey] || [];
  const top12    = wordList.slice(0, 12);
  const top15    = wordList.slice(0, 15);
  const top20    = wordList.slice(0, 20);

  const modules = [
    { name: 'grammar',      prompt: () => buildGrammarPrompt(lvl, unitDef),           validate: validGrammar },
    { name: 'conjugaison',  prompt: () => buildConjugaisonPrompt(lvl, unitDef),        validate: validConjugaison },
    { name: 'orthographe',  prompt: () => buildOrthographePrompt(lvl, unitDef),        validate: validOrthographe },
    { name: 'vocabulary',   prompt: () => buildVocabPrompt(lvl, unitDef, wordList),    validate: r => validVocabulary(r, wordList.length) },
    { name: 'reading',      prompt: () => buildReadingPrompt(lvl, unitDef, top15),     validate: validReading },
    { name: 'listening',    prompt: () => buildListeningPrompt(lvl, unitDef, top12),   validate: validListening },
    { name: 'writing',      prompt: () => buildWritingPrompt(lvl, unitDef, top15),     validate: validWriting },
    { name: 'speaking',     prompt: () => buildSpeakingPrompt(lvl, unitDef),           validate: validSpeaking },
    { name: 'review',       prompt: () => buildReviewPrompt(lvl, unitDef, top20),      validate: validReview },
  ];

  // In fix-nulls mode: load existing file, regenerate only null modules
  if (fixNulls && fs.existsSync(outFile)) {
    const existing = JSON.parse(fs.readFileSync(outFile, 'utf-8'));
    const broken   = modules.filter(m => existing[m.name] === null || existing[m.name] === undefined);
    if (broken.length === 0) {
      console.log(`[${lvl} Unit ${pad(unitNum, 2)}/${totalUnits}] No nulls — skipping.`);
      return;
    }
    console.log(`  [${lvl} Unit ${pad(unitNum, 2)}/${totalUnits}] Fixing: ${broken.map(m => m.name).join(', ')}`);
    const entries = await Promise.all(
      broken.map(async (mod) => {
        try {
          const data = await callWithRetry(mod.prompt(), mod.validate, mod.name);
          console.log(`    ✓ ${mod.name}`);
          return [mod.name, data];
        } catch (err) {
          console.error(`    ✗ ${mod.name}: ${err.message}`);
          return [mod.name, null];
        }
      })
    );
    for (const [name, data] of entries) existing[name] = data;
    fs.writeFileSync(outFile, JSON.stringify(existing, null, 2), 'utf-8');
    console.log(`  ✓ Updated ${outFile}`);
    return;
  }

  if (fs.existsSync(outFile)) {
    console.log(`[${lvl} Unit ${pad(unitNum, 2)}/${totalUnits}] Skipping — file already exists.`);
    return;
  }

  const result = {
    meta: {
      level:           lvl,
      unit:            unitNum,
      topic:           unitDef.topic,
      knowledge_focus: unitDef.knowledge_focus,
      delf_angle:      unitDef.toefl_angle,
      grammar_point:   unitDef.grammar_point,
    },
  };

  console.log(`  [${lvl} Unit ${pad(unitNum, 2)}/${totalUnits}] Generating all 9 modules in parallel...`);

  const entries = await Promise.all(
    modules.map(async (mod) => {
      try {
        const data = await callWithRetry(mod.prompt(), mod.validate, mod.name);
        console.log(`    ✓ ${mod.name}`);
        return [mod.name, data];
      } catch (err) {
        console.error(`    ✗ ${mod.name}: ${err.message}`);
        return [mod.name, null];
      }
    })
  );

  for (const [name, data] of entries) result[name] = data;

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`  ✓ Saved ${outFile}`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  // Parse CLI flags
  const args      = process.argv.slice(2);
  const levelIdx  = args.indexOf('--level');
  const levelFlag = levelIdx !== -1 ? (args[levelIdx + 1] ?? '').toUpperCase() || null : null;
  const unitIdx   = args.indexOf('--unit');
  const unitFlag  = unitIdx !== -1 ? (parseInt(args[unitIdx + 1]) || null) : null;
  const fixNulls  = args.includes('--fix-nulls');

  if (levelFlag && !LEVELS.includes(levelFlag)) {
    console.error(`Invalid --level "${levelFlag}". Must be one of: ${LEVELS.join(', ')}.`);
    process.exit(1);
  }

  // Load all vocab-by-unit files once
  const vocabByLevel = {};
  for (const lvl of LEVELS) {
    const file = path.join(DATA_DIR, `french-vocab-${lvl.toLowerCase()}-by-unit.json`);
    if (!fs.existsSync(file)) {
      console.error(`Missing vocab file: ${file}`);
      process.exit(1);
    }
    vocabByLevel[lvl] = JSON.parse(fs.readFileSync(file, 'utf-8'));
    console.log(`Loaded vocab for ${lvl} (${Object.keys(vocabByLevel[lvl]).length} units)`);
  }

  // Create output base dirs
  fs.mkdirSync(OUTPUT_BASE, { recursive: true });

  const levelsToRun = levelFlag ? [levelFlag] : LEVELS;

  for (const lvl of levelsToRun) {
    const units     = UNITS[lvl];
    const vocabMap  = vocabByLevel[lvl];
    const unitsToRun = unitFlag
      ? units.filter(u => u.unit === unitFlag)
      : units;

    if (unitFlag && unitsToRun.length === 0) {
      console.error(`No unit ${unitFlag} found in level ${lvl}.`);
      continue;
    }

    console.log(`\n══ ${lvl} — ${unitsToRun.length} unit(s) to process ══`);

    const BATCH_SIZE = 3;
    for (let i = 0; i < unitsToRun.length; i += BATCH_SIZE) {
      const batch = unitsToRun.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(u => generateUnit(lvl, u, u.unit, units.length, vocabMap, fixNulls)));
    }
  }

  console.log('\nDone.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
