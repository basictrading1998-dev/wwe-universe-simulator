let fighters = [];
let activeRosterQuickFilter = 'all';
const BOSS_TIER_DRAFT_SESSION_KEY = 'wweRosterBossTierDraft';

const femaleFighterTemplates = [
    { name: 'Abigail', division: 'Cruiser Weight' },
    { name: 'Akane Kobayashi', division: 'Cruiser Weight' },
    { name: 'Alba Fyre', division: 'Cruiser Weight' },
    { name: 'Alexa Bliss', division: 'Cruiser Weight' },
    { name: 'Alice Link', division: 'Cruiser Weight' },
    { name: 'Ashley', division: 'Cruiser Weight' },
    { name: 'Asuka', division: 'Light HeavyWeight' },
    { name: 'Azrael Faria', division: 'Light HeavyWeight' },
    { name: 'Bayley', division: 'Cruiser Weight' },
    { name: 'Becky Lynch', division: 'Light HeavyWeight' },
    { name: "Becky Lynch '19", division: 'Light HeavyWeight' },
    { name: 'Beth Phoenix', division: 'HeavyWeight' },
    { name: 'Bianca Belair', division: 'HeavyWeight' },
    { name: "Bianca Belair '17", division: 'HeavyWeight' },
    { name: 'Black Cat', division: 'Cruiser Weight' },
    { name: 'Blair Davenport', division: 'Light HeavyWeight' },
    { name: 'Candice LeRAE', division: 'Cruiser Weight' },
    { name: 'Carmella', division: 'Cruiser Weight' },
    { name: 'Charlotte Flair', division: 'HeavyWeight' },
    { name: "Charlotte Flair '17", division: 'HeavyWeight' },
    { name: "Charlotte Flair '19", division: 'HeavyWeight' },
    { name: 'Chelsea Green', division: 'Light HeavyWeight' },
    { name: 'Chyna', division: 'HeavyWeight' },
    { name: 'Cora Jade', division: 'Light HeavyWeight' },
    { name: 'Dakota Kai', division: 'Cruiser Weight' },
    { name: 'Despair', division: 'Light HeavyWeight' },
    { name: 'Elisabeth Olsen', division: 'Light HeavyWeight' },
    { name: 'Elodie Diep', division: 'Light HeavyWeight' },
    { name: 'EVE Torres', division: 'Light HeavyWeight' },
    { name: 'Fallon Henley', division: 'Light HeavyWeight' },
    { name: 'GIGI Dolin', division: 'Cruiser Weight' },
    { name: 'Indi Hartwell', division: 'Light HeavyWeight' },
    { name: 'Isabela Merced', division: 'Cruiser Weight' },
    { name: 'Isla Dawn', division: 'HeavyWeight' },
    { name: 'IVY Nile', division: 'Light HeavyWeight' },
    { name: 'IYO Sky', division: 'Cruiser Weight' },
    { name: 'Jackie IVY', division: 'Cruiser Weight' },
    { name: 'Jacy Jane', division: 'Cruiser Weight' },
    { name: 'Jade Cargill', division: 'HeavyWeight' },
    { name: 'Jayce Harris', division: 'Cruiser Weight' },
    { name: 'Jazmyn', division: 'Cruiser Weight' },
    { name: 'Jenna Ortega', division: 'Cruiser Weight' },
    { name: 'Kairi Sane', division: 'Cruiser Weight' },
    { name: 'Katana Chance', division: 'Cruiser Weight' },
    { name: 'Kayden Carter', division: 'Cruiser Weight' },
    { name: 'Kimberly Garcia', division: 'Cruiser Weight' },
    { name: 'LITA', division: 'Light HeavyWeight' },
    { name: 'Liv Morgan', division: 'Cruiser Weight' },
    { name: 'LYRA Valkyria', division: 'Light HeavyWeight' },
    { name: 'Madison Lanza', division: 'Cruiser Weight' },
    { name: 'Marilyn Breaker', division: 'Cruiser Weight' },
    { name: 'Maryse', division: 'Cruiser Weight' },
    { name: 'Maxxine Dupri', division: 'Light HeavyWeight' },
    { name: 'Michelle McCool', division: 'Light HeavyWeight' },
    { name: 'Michin', division: 'Cruiser Weight' },
    { name: 'Mighty Molly', division: 'Light HeavyWeight' },
    { name: 'Molly Holly', division: 'Light HeavyWeight' },
    { name: 'Mrs. Wuggy', division: 'Light HeavyWeight' },
    { name: 'Natalya', division: 'Light HeavyWeight' },
    { name: 'Nebula', division: 'Cruiser Weight' },
    { name: 'Nia Jax', division: 'Super HeavyWeight' },
    { name: 'Nikki Cross', division: 'Cruiser Weight' },
    { name: 'Nikkita Lyons', division: 'Light HeavyWeight' },
    { name: 'Piper Niven', division: 'HeavyWeight' },
    { name: 'Rachel Page', division: 'Light HeavyWeight' },
    { name: 'Raquel Rodriguez', division: 'HeavyWeight' },
    { name: 'Rhea Ripley', division: 'HeavyWeight' },
    { name: "Rhea Ripley '17", division: 'HeavyWeight' },
    { name: "Rhea Ripley '20", division: 'HeavyWeight' },
    { name: 'Ronda Rousey', division: 'Light HeavyWeight' },
    { name: 'Roxxan Perez', division: 'Cruiser Weight' },
    { name: 'Samantha Ramirez', division: 'Cruiser Weight' },
    { name: 'Scarlett', division: 'Light HeavyWeight' },
    { name: 'Sensational Sherri', division: 'Light HeavyWeight' },
    { name: 'Shayna Basler', division: 'Light HeavyWeight' },
    { name: 'Shotzi', division: 'Light HeavyWeight' },
    { name: 'Skylar Reks', division: 'Cruiser Weight' },
    { name: 'Sofia Merced', division: 'Light HeavyWeight' },
    { name: 'Sonya Deville', division: 'Light HeavyWeight' },
    { name: 'Stacy Keibler', division: 'Light HeavyWeight' },
    { name: 'Stephanie McMahon', division: 'Light HeavyWeight' },
    { name: 'Tamina', division: 'HeavyWeight' },
    { name: 'Tegan Nox', division: 'Light HeavyWeight' },
    { name: 'Thea Hail', division: 'Light HeavyWeight' },
    { name: 'Tiffany Stratton', division: 'Light HeavyWeight' },
    { name: 'Trish Stratus', division: 'Light HeavyWeight' },
    { name: 'Valhalla', division: 'Light HeavyWeight' },
    { name: 'Weeping Angel', division: 'HeavyWeight' },
    { name: 'Wendy Choo', division: 'Light HeavyWeight' },
    { name: 'XIA LI', division: 'Light HeavyWeight' },
    { name: 'Zelina Vega', division: 'Cruiser Weight' },
    { name: 'Ziggy', division: 'Cruiser Weight' },
    { name: 'Zoey Stark', division: 'Light HeavyWeight' }
];

const maleDivisionLookup = {
  "AJ Hawk": "Heavyweight",
  "AJ Styles": "Light Heavyweight",
  "Akira Tozawa": "Cruiserweight",
  "Alba Fyre": "Cruiserweight",
  "Alexa Bliss": "Cruiserweight",
  "Andre Chase": "Light Heavyweight",
  "Andre the Giant": "Super Heavyweight",
  "Angel Garza": "Cruiserweight",
  "Angelo Dawkins": "Heavyweight",
  "Apollo Crews": "Heavyweight",
  "Ashante “Thee” Adonis": "Light Heavyweight",
  "Asuka": "Light Heavyweight",
  "Asuka 64-Bit": "???",
  "Austin Theory": "Light Heavyweight",
  "Axiom": "Cruiserweight",
  "Bad Bunny": "Cruiserweight",
  "Baron Corbin": "Heavyweight",
  "Batista": "Heavyweight",
  "Bayley": "Cruiserweight",
  "Becky Lynch": "Light Heavyweight",
  "Becky Lynch '18": "Light Heavyweight",
  "Becky Lynch '19": "Light Heavyweight",
  "Beth Phoenix": "Heavyweight",
  "Bianca Belair": "Heavyweight",
  "Bianca Belair '17": "Heavyweight",
  "Bianca Belair 64-Bit": "???",
  "Big Boss Man": "Super Heavyweight",
  "Big E": "Heavyweight",
  "Blair Davenport": "Light Heavyweight",
  "Bobby Lashley": "Heavyweight",
  "Boogeyman": "Heavyweight",
  "Booker T": "Heavyweight",
  "Boston Connor": "Heavyweight",
  "Braun Strowman": "Super Heavyweight",
  "Bray Wyatt": "Heavyweight",
  "Bray Wyatt '20": "Heavyweight",
  "Bray Wyatt '20 (nWo)": "Heavyweight",
  "Bray Wyatt '20 (SNME)": "Heavyweight",
  "Bret “Hit Man” Hart": "Light Heavyweight",
  "Bret “Hit Man” Hart '92": "Light Heavyweight",
  "British Bulldog": "Heavyweight",
  "Bron Breakker": "Light Heavyweight",
  "Bronson Reed": "Super Heavyweight",
  "Brooks Jensen": "Heavyweight",
  "Bruno Sammartino": "Heavyweight",
  "Brutus Creed": "Heavyweight",
  "Bubba Ray Dudley": "Super Heavyweight",
  "Butch": "Cruiserweight",
  "Cactus Jack": "Heavyweight",
  "Cameron Grimes": "Light Heavyweight",
  "Candice LeRae": "Cruiserweight",
  "Carmella": "Cruiserweight",
  "Carmelo Hayes": "Light Heavyweight",
  "Cedric Alexander": "Cruiserweight",
  "Chad Gable": "Cruiserweight",
  "Chad Gable '16": "Cruiserweight",
  "Channing “Stacks” Lorenzo": "Light Heavyweight",
  "Charlotte Flair": "Heavyweight",
  "Charlotte Flair '17": "Heavyweight",
  "Charlotte Flair '19": "Heavyweight",
  "Chelsea Green": "Light Heavyweight",
  "Chyna": "Heavyweight",
  "CM Punk": "Light Heavyweight",
  "Cody Rhodes": "Light Heavyweight",
  "Cora Jade": "Light Heavyweight",
  "Cruz del Toro": "Cruiserweight",
  "Dakota Kai": "Cruiserweight",
  "Damian Priest": "Heavyweight",
  "Damon Kemp": "Light Heavyweight",
  "Darius Butler": "Cruiserweight",
  "Dexter Lumis": "Light Heavyweight",
  "Diamond Dallas Page": "???",
  "Diesel": "Super Heavyweight",
  "Dijak": "Heavyweight",
  "Doink the Clown": "Heavyweight",
  "Drew Gulak": "Cruiserweight",
  "Drew McIntyre": "Heavyweight",
  "Dude Love": "Heavyweight",
  "Duke Hudson": "Heavyweight",
  "Dusty Rhodes": "Heavyweight",
  "D-Von Dudley": "Heavyweight",
  "Eddie Guerrero": "Light Heavyweight",
  "Eddie Guerrero '97": "Cruiserweight",
  "Elton Prince": "Cruiserweight",
  "Eric Bischoff": "Cruiserweight",
  "Erik": "Heavyweight",
  "Eve Torres": "Light Heavyweight",
  "Faarooq": "Heavyweight",
  "Fallon Henley": "Light Heavyweight",
  "The Fiend Bray Wyatt": "Heavyweight",
  "Finn Bálor": "Cruiserweight",
  "Finn BÃ¡lor": "Cruiserweight",
  "George “The Animal” Steele": "Heavyweight",
  "Gigi Dolin": "Cruiserweight",
  "Giovanni Vinci": "Light Heavyweight",
  "Grayson Waller": "Light Heavyweight",
  "Great Muta": "???",
  "Gunther": "Heavyweight",
  "Harley Race": "Heavyweight",
  "Hollywood Hogan": "Heavyweight",
  "Honky Tonk Man": "Heavyweight",
  "Hulk Hogan": "Heavyweight",
  "Hulk Hogan '02": "Heavyweight",
  "Humberto Carrillo": "Cruiserweight",
  "Ilja Dragunov": "Cruiserweight",
  "Indi Hartwell": "Light Heavyweight",
  "Iron Sheik": "???",
  "Isla Dawn": "Heavyweight",
  "Ivar": "Super Heavyweight",
  "Ivy Nile": "Light Heavyweight",
  "IYO SKY": "Cruiserweight",
  "Jacy Jayne": "Cruiserweight",
  "Jake “The Snake” Roberts": "Heavyweight",
  "JBL": "Heavyweight",
  "JD McDonagh": "Cruiserweight",
  "Jean-Paul Levesque": "Heavyweight",
  "Jerry “The King” Lawler": "Light Heavyweight",
  "Jey Uso": "Heavyweight",
  "Jim “The Anvil” Neidhart": "Heavyweight",
  "Jimmy Uso": "Heavyweight",
  "Jinder Mahal": "Light Heavyweight",
  "Joaquin Wilde": "Cruiserweight",
  "Joe Coffey": "Heavyweight",
  "Joe Gacy": "Heavyweight",
  "John Cena": "Heavyweight",
  "John Cena '20": "Heavyweight",
  "John Cena '20 (2002)": "Heavyweight",
  "John Cena '20 (DOC)": "Heavyweight",
  "John Cena '20 (nWo)": "Heavyweight",
  "John Cena '20 (SNME)": "Heavyweight",
  "John Cena '20 (WM30)": "Heavyweight",
  "Johnny Gargano": "Cruiserweight",
  "Josh Briggs": "Heavyweight",
  "Julius Creed": "Light Heavyweight",
  "Kane": "Super Heavyweight",
  "Kane '08": "Super Heavyweight",
  "Karl Anderson": "Light Heavyweight",
  "Karrion Kross": "Heavyweight",
  "Katana Chance": "Cruiserweight",
  "Kayden Carter": "Cruiserweight",
  "Ken Shamrock": "Light Heavyweight",
  "Kevin Nash": "Super Heavyweight",
  "Kevin Owens": "Heavyweight",
  "Kit Wilson": "Cruiserweight",
  "Kofi Kingston": "Light Heavyweight",
  "Kurt Angle": "Light Heavyweight",
  "LA Knight": "Heavyweight",
  "Lex Luger": "???",
  "Lita": "Light Heavyweight",
  "Liv Morgan": "Cruiserweight",
  "Logan Paul": "Cruiserweight",
  "Ludwig Kaiser": "Light Heavyweight",
  "Luke Gallows": "Heavyweight",
  "Mankind": "Heavyweight",
  "Mark Coffey": "Light Heavyweight",
  "Maryse": "Cruiserweight",
  "Michin": "Cruiserweight",
  "Michin 64-Bit": "???",
  "Mighty Molly": "Light Heavyweight",
  "Molly Holly": "Light Heavyweight",
  "Montez Ford": "Light Heavyweight",
  "Mosh": "Heavyweight",
  "Mr. Perfect": "???",
  "Muhammad Ali": "Light Heavyweight",
  "MVP": "Heavyweight",
  "Natalya": "Light Heavyweight",
  "Nathan Frazer": "Cruiserweight",
  "Nikki Cross": "Cruiserweight",
  "Nikkita Lyons": "Light Heavyweight",
  "Noam Dar": "Cruiserweight",
  "Omos": "Super Heavyweight",
  "Otis": "Super Heavyweight",
  "Pat McAfee": "Light Heavyweight",
  "Piper Niven": "Heavyweight",
  "Post Malone": "Cruiserweight",
  "Randy Orton": "Heavyweight",
  "Randy Orton '02": "Heavyweight",
  "Randy Orton '09": "???",
  "Randy Orton '15": "Heavyweight",
  "Raquel Rodriguez": "Heavyweight",
  "Raquel Rodriguez 64-Bit": "???",
  "Razor Ramon": "Heavyweight",
  "Rey Mysterio": "Cruiserweight",
  "Rey Mysterio '06": "Cruiserweight",
  "Rey Mysterio Jr.": "Cruiserweight",
  "Rhea Ripley": "Heavyweight",
  "Rhea Ripley '17": "Heavyweight",
  "Rhea Ripley '20": "Heavyweight",
  "Rick Steiner": "Heavyweight",
  "Ricky Steamboat": "Light Heavyweight",
  "Ricochet": "Cruiserweight",
  "Ridge Holland": "Heavyweight",
  "Rikishi": "Super Heavyweight",
  "Rob Van Dam": "Light Heavyweight",
  "Robert Roode": "Light Heavyweight",
  "Roman Reigns": "Heavyweight",
  "Roman Reigns '15": "Heavyweight",
  "Roman Reigns '24": "Heavyweight",
  "Roman Reigns 64-Bit": "???",
  "Ronda Rousey": "Light Heavyweight",
  "Roxanne Perez": "Cruiserweight",
  "R-Truth": "Light Heavyweight",
  "Sami Zayn": "Light Heavyweight",
  "Sandman": "Heavyweight",
  "Sanga": "Heavyweight",
  "Santos Escobar": "Cruiserweight",
  "Scarlett": "Light Heavyweight",
  "Scott Hall": "Heavyweight",
  "Scott Steiner": "Heavyweight",
  "SCRYPTS": "Cruiserweight",
  "Sensational Sherri": "Light Heavyweight",
  "Seth “Freakin” Rollins": "Light Heavyweight",
  "Seth Rollins '14": "Light Heavyweight",
  "Seth Rollins '15": "Light Heavyweight",
  "Shane McMahon": "Light Heavyweight",
  "Shawn Michaels": "Light Heavyweight",
  "Shawn Michaels '05": "Light Heavyweight",
  "Shawn Michaels '09": "Light Heavyweight",
  "Shawn Michaels '94": "Light Heavyweight",
  "Shayna Baszler": "Light Heavyweight",
  "Sheamus": "Heavyweight",
  "Sheamus '09": "Heavyweight",
  "Shinsuke Nakamura": "Light Heavyweight",
  "Shotzi": "Light Heavyweight",
  "Solo Sikoa": "Heavyweight",
  "Sonya Deville": "Light Heavyweight",
  "Stacy Keibler": "Light Heavyweight",
  "Stardust": "Light Heavyweight",
  "Stephanie McMahon": "Light Heavyweight",
  "Syxx": "Light Heavyweight",
  "Tamina": "Heavyweight",
  "Ted DiBiase": "Heavyweight",
  "Tegan Nox": "Light Heavyweight",
  "Terry Funk": "Heavyweight",
  "The Fiend Bray Wyatt": "Heavyweight",
  "The Hurricane": "Light Heavyweight",
  "The Miz": "Light Heavyweight",
  "The Rock": "Heavyweight",
  "The Rock '01": "Heavyweight",
  "The Rock '24": "Heavyweight",
  "Thea Hail": "Light Heavyweight",
  "Thrasher": "Heavyweight",
  "Tiffany Stratton": "Light Heavyweight",
  "Tommaso Ciampa": "Cruiserweight",
  "Tony D'Angelo": "Heavyweight",
  "Trick Williams": "Cruiserweight",
  "Trick Williams '22": "Cruiserweight",
  "Triple H": "Heavyweight",
  "Triple H '08": "Heavyweight",
  "Triple H '14": "Heavyweight",
  "Trish Stratus": "Light Heavyweight",
  "Ty Schmit": "Light Heavyweight",
  "Tyler Bate": "Cruiserweight",
  "Tyler Breeze": "Light Heavyweight",
  "Ultimate Warrior": "Heavyweight",
  "Umaga": "Super Heavyweight",
  "Uncle Howdy": "Light Heavyweight",
  "Undertaker": "Heavyweight",
  "Undertaker '03": "Heavyweight",
  "Undertaker '09": "Heavyweight",
  "Undertaker '14": "Heavyweight",
  "Undertaker '98": "Heavyweight",
  "Vader": "Super Heavyweight",
  "Valhalla": "Light Heavyweight",
  "Veer Mahaan": "Heavyweight",
  "Wade Barrett": "Heavyweight",
  "Wendy Choo": "Light Heavyweight",
  "Wes Lee": "Cruiserweight",
  "William Regal": "Heavyweight",
  "Wolfgang": "Heavyweight",
  "Xavier Woods": "Cruiserweight",
  "Xavier Woods 64-Bit": "???",
  "Xia Li": "Light Heavyweight",
  "X-Pac": "Light Heavyweight",
  "Yokozuna": "Super Heavyweight",
  "Zelina Vega": "Cruiserweight",
  "Zero": "Cruiserweight",
  "Zoey Stark": "Light Heavyweight"
};

const wwe2k24RosterNames = `
AJ Hawk
AJ Styles
Akira Tozawa
Alba Fyre
Alexa Bliss
Andre Chase
Andre the Giant
Angel Garza
Angelo Dawkins
Apollo Crews
Ashante “Thee” Adonis
Asuka
Asuka 64-Bit
Austin Theory
Axiom
Bad Bunny
Baron Corbin
Batista
Bayley
Becky Lynch
Becky Lynch '18
Becky Lynch '19
Beth Phoenix
Bianca Belair
Bianca Belair 64-Bit
Bianca Belair '17
Big Boss Man
Big E
Blair Davenport
Bobby Lashley
Boogeyman
Booker T
Boston Connor
Braun Strowman
Bray Wyatt
Bray Wyatt '20
Bray Wyatt '20 (nWo)
Bray Wyatt '20 (SNME)
Bret “Hit Man” Hart
Bret “Hit Man” Hart '92
British Bulldog
Bron Breakker
Bronson Reed
Brooks Jensen
Bruno Sammartino
Brutus Creed
Bubba Ray Dudley
Butch
Cactus Jack
Cameron Grimes
Candice LeRae
Carlito
Carmella
Carmelo Hayes
Cedric Alexander
Chad Gable
Chad Gable '16
Channing “Stacks” Lorenzo
Charlotte Flair
Charlotte Flair '17
Charlotte Flair '19
Chelsea Green
Chyna
CM Punk
Cody Rhodes
Cora Jade
Cruz del Toro
Dakota Kai
Damian Priest
Damon Kemp
Darius Butler
Dexter Lumis
Diamond Dallas Page
Diesel
Dijak
“Dirty” Dominik Mysterio
Doink the Clown
Dominik Mysterio “Masked”
Dragon Lee
Drew Gulak
Drew McIntyre
Dude Love
Duke Hudson
Dusty Rhodes
D-Von Dudley
Eddie Guerrero
Eddie Guerrero '97
“Elite” Cody Rhodes
“Elite” Hulk Hogan
“Elite” John Cena
Elton Prince
Eric Bischoff
Erik
Eve Torres
Faarooq
Fallon Henley
The Fiend Bray Wyatt
Finn Bálor
George “The Animal” Steele
Gigi Dolin
Giovanni Vinci
Grayson Waller
Great Muta
Gunther
Harley Race
Hollywood Hogan
Honky Tonk Man
Hulk Hogan
Hulk Hogan '02
Humberto Carrillo
The Hurricane
“Ichiban” Hulk Hogan
Ilja Dragunov
Indi Hartwell
Iron Sheik
Isla Dawn
Ivar
Ivy Nile
IYO SKY
Jacy Jayne
Jade Cargill
Jake “The Snake” Roberts
JBL
JD McDonagh
Jean-Paul Levesque
Jerry “The King” Lawler
Jey Uso
Jim “The Anvil” Neidhart
Jimmy Uso
Jinder Mahal
Joaquin Wilde
Joe Coffey
Joe Gacy
John Cena
John Cena '20
John Cena '20 (DOC)
John Cena '20 (nWo)
John Cena '20 (SNME)
John Cena '20 (WM30)
John Cena '20 (2002)
Johnny Gargano
Josh Briggs
Juan Cena
Julius Creed
Kairi Sane
Kane
Kane '08
Karl Anderson
Karrion Kross
Katana Chance
Kayden Carter
Ken Shamrock
Kevin Nash
Kevin Owens
Kit Wilson
Kofi Kingston
Kurt Angle
LA Knight
Lex Luger
Lita
Liv Morgan
Logan Paul
Ludwig Kaiser
Luke Gallows
Lyra Valkyria
“Macho King” Randy Savage
“Macho Man” Randy Savage
Mankind
Mark Coffey
Maryse
Maxxine Dupri
Michelle McCool
Michin
Michin 64-Bit
Mighty Molly
The Miz
Molly Holly
Montez Ford
Mosh
Muhammad Ali
Mr. Perfect
MVP
Natalya
Nathan Frazer
Nia Jax
Nikki Cross
Nikkita Lyons
Noam Dar
Omos
Otis
Pat McAfee
Piper Niven
Post Malone
R-Truth
Randy Orton
Randy Orton '02
Randy Orton '09
Randy Orton '15
Raquel Rodriguez
Raquel Rodriguez 64-Bit
“Ravishing” Rick Rude
Razor Ramon
Rey Mysterio
Rey Mysterio '06
Rey Mysterio Jr.
Rhea Ripley
Rhea Ripley '17
Rhea Ripley '20
Rick Steiner
Ricky Steamboat
Ricochet
Ridge Holland
Rikishi
Rob Van Dam
Robert Roode
The Rock
The Rock '01
The Rock '24
Roman Reigns
Roman Reigns 64-Bit
Roman Reigns '15
Roman Reigns '24
Ronda Rousey
“Rowdy” Roddy Piper
Roxanne Perez
Sami Zayn
Sandman
Sanga
Santos Escobar
Scarlett
Scott Hall
Scott Steiner
SCRYPTS
Sensational Sherri
Seth “Freakin” Rollins
Seth Rollins '14
Seth Rollins '15
Shane McMahon
Shawn Michaels
Shawn Michaels '05
Shawn Michaels '09
Shawn Michaels '94
Shayna Baszler
Sheamus
Sheamus '09
Shinsuke Nakamura
Shotzi
Solo Sikoa
Sonya Deville
Stacy Keibler
Stardust
Stephanie McMahon
“Stone Cold” Steve Austin
“Stone Cold” Steve Austin '01
“Stone Cold” Steve Austin '97
“Superstar” Billy Graham
Syxx
Tamina
Ted DiBiase
Tegan Nox
Terry Funk
Thea Hail
Thrasher
Tiffany Stratton
Tommaso Ciampa
Tony D'Angelo
Trick Williams
Trick Williams '22
Triple H
Triple H '08
Triple H '14
Trish Stratus
Ty Schmit
Tyler Bate
Tyler Breeze
Ultimate Warrior
Umaga
Uncle Howdy
“Undashing” Cody Rhodes
Undertaker
Undertaker '03
Undertaker '09
Undertaker '14
Undertaker '98
Vader
Valhalla
Veer Mahaan
Wade Barrett
Wendy Choo
Wes Lee
William Regal
Wolfgang
X-Pac
Xavier Woods
Xavier Woods 64-Bit
Xia Li
Yokozuna
Zelina Vega
Zero
Zoey Stark
`;

const wwe2k24RosterNamesList = wwe2k24RosterNames.split(/\r?\n/).map(name => name.trim()).filter(Boolean);

const wwe2k24PortraitMap = {};
const legacyWWE2K24PortraitUrls = new Set([
    'https://www.wwe.com/f/styles/talent_champion_xl/public/2026/05/Roman_Reigns_PROFILE.png',
    'https://www.wwe.com/f/styles/talent_champion_xl/public/2026/05/SETH_ROLLINS_04132026sb_0095_Profile.png',
    'https://www.wwe.com/f/styles/talent_champion_xl/public/2026/03/CODY_04262024gd_0100_headSawp_Profile.png',
    'https://www.wwe.com/f/styles/talent_champion_xl/public/2025/11/Bayley_PROFILE.png',
    'https://www.wwe.com/f/styles/talent_champion_xl/public/2025/11/Becky_Lynch_PROFILE.png',
    'https://www.wwe.com/f/styles/talent_champion_xl/public/2026/08/Candice_06122026MM_24123_Profile.png',
    'https://www.wwe.com/f/styles/talent_champion_xl/public/2025/11/Alexa_Bliss_Profile.png',
    'https://www.wwe.com/f/styles/talent_champion_xl/public/2024/03/BiancaBelair_01282024RF_1159_Profile--f32b01959da5065b6d2b2b9887792b92.png',
    'https://www.wwe.com/f/styles/talent_champion_xl/public/all/2022/11/Isla_Dawn_PROFILE--fce74e97e2e9a286d06b5682a696b815.png',
    'https://www.wwe.com/f/styles/talent_champion_xl/public/2026/04/Rhea_04242026ca_037_Profile.png',
    'https://www.wwe.com/f/styles/talent_champion_xl/public/2026/08/Roxanne_Perez_PROFILE.png',
    'https://www.wwe.com/f/styles/talent_champion_xl/public/2026/07/Jade_PROFILE.png',
    'https://www.wwe.com/f/styles/talent_champion_xl/public/all/2024/06/LIV_05132024ca_023_Title_Profile--530195974e3839e08bdb34e41adbaed5.png',
    'https://www.wwe.com/f/styles/talent_champion_xl/public/2025/11/Shawn_Michaels_PROFILE.png',
    'https://www.wwe.com/f/styles/talent_champion_xl/public/all/2024/03/The_Rock_PROFILE--927b15797eefad54a3bca4d2a15e4921.png'
]);

const wwe2k24PortraitMapNormalized = {};

window.wwe2k24PortraitMap = wwe2k24PortraitMap;
window.wwe2k24PortraitMapNormalized = wwe2k24PortraitMapNormalized;

const maleDivisionLookupNormalized = Object.keys(maleDivisionLookup).reduce((acc, name) => {
    acc[normalizeLookupKey(name)] = maleDivisionLookup[name];
    return acc;
}, {});

function normalizeLookupKey(value) {
    return (value || '').toString()
        .normalize('NFC')
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
        .replace(/[\u2010-\u2015]/g, '-')
        .replace(/\u00A0/g, ' ')
        .replace(/\s*['’]\s*(?:[0-9]{2}|[0-9]{4})\b/g, '')
        .replace(/\s*[\"“”][^\"“”]*[\"“”]\s*/g, ' ')
        .replace(/\b(?:64|32)-Bit\b/gi, '')
        .replace(/\b(?:PS[ -]?5|PS[ -]?4|Xbox(?:\s*One)?|Switch|Steam|PC|64-Bit|32-Bit|GameCube|Dreamcast|N64|Genesis)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function getRosterGenderFromName(name) {
    const normalizedName = normalizeLookupKey(name);
    return femaleFighterTemplates.some(template => normalizeLookupKey(template.name) === normalizedName) ? 'female' : 'male';
}

function getRosterDivisionForName(name, gender) {
    const normalizedName = normalizeLookupKey(name);
    if (gender === 'female') {
        const template = femaleFighterTemplates.find(template => normalizeLookupKey(template.name) === normalizedName);
        return template ? template.division : null;
    }
    return getMappedDivisionForName(name);
}

function getWWE2K24Portrait(name) {
    return '';
}

function clearInjectedWWE2K24Portraits(list = fighters) {
    if (!Array.isArray(list)) return 0;
    let removed = 0;

    list.forEach(f => {
        if (!f || typeof f !== 'object') return;
        const currentPhoto = typeof f.photo === 'string' ? f.photo.trim() : '';
        const photoKey = typeof f.photo_key === 'string' ? f.photo_key.trim() : '';

        const isInjectedPortrait = legacyWWE2K24PortraitUrls.has(currentPhoto)
            || (photoKey.startsWith('wwe2k24-') && !currentPhoto.startsWith('data:image') && !currentPhoto.startsWith('blob:'));

        if (!isInjectedPortrait || hasValidAssignedPhoto(f)) return;

        f.photo = '';
        if (photoKey) f.photo_key = '';
        removed++;
    });

    if (removed > 0) {
        try { saveFighters(list); } catch (err) { console.warn('Failed to remove injected WWE portraits', err); }
    }

    return removed;
}

window.getWWE2K24Portrait = getWWE2K24Portrait;
window.normalizeLookupKey = normalizeLookupKey;
window.clearInjectedWWE2K24Portraits = clearInjectedWWE2K24Portraits;

function normalizePortraitLookupVariants(name) {
    if (!name) return [];
    const base = normalizeLookupKey(name);
    const variants = new Set([base]);

    const nicknameFree = base.replace(/\s+(?:the|freakin|thee|jr|sr|ii|iii|iv|v)\b/g, ' ');
    if (nicknameFree.trim()) variants.add(nicknameFree.trim());

    const tokens = base.split(/\s+/).filter(Boolean);
    if (tokens.length > 1) {
        variants.add(tokens[0]);
        variants.add(tokens[tokens.length - 1]);
    }

    return Array.from(variants).filter(Boolean);
}

function forceHydrateAllPhotos(list = fighters) {
    if (!Array.isArray(list)) return 0;

    function findPortraitForName(name) {
        if (!name) return '';

        const direct = getWWE2K24Portrait(name);
        if (direct) return direct;

        const base = normalizeLookupKey(name);
        const nameVariants = normalizePortraitLookupVariants(name);
        const candidates = Object.entries(wwe2k24PortraitMapNormalized);

        let bestMatch = null;
        let bestScore = 0;

        for (const [mapKey, url] of candidates) {
            const mapTokens = mapKey.split(/\s+/).filter(Boolean);
            const sourceTokens = base.split(/\s+/).filter(Boolean);
            if (sourceTokens.length === 0 || mapTokens.length === 0) continue;

            const exact = mapKey === base || nameVariants.includes(mapKey);
            if (exact) return url;

            const common = sourceTokens.filter(token => mapTokens.includes(token)).length;
            const overlap = mapTokens.filter(token => sourceTokens.includes(token)).length;
            const score = common + overlap;
            if (score > 0 && score >= bestScore) {
                bestScore = score;
                bestMatch = url;
            }

            const normalizedMatches = nameVariants.some(variant => variant === mapKey || mapKey.includes(variant) || variant.includes(mapKey));
            if (normalizedMatches) {
                return url;
            }
        }

        return bestMatch || '';
    }

    let restored = 0;
    list.forEach(f => {
        if (!f || typeof f !== 'object') return;
        // If a valid custom photo is already assigned (in-memory, cached, or DOM), do not overwrite
        if (hasValidAssignedPhoto(f)) return;
        const currentPhoto = typeof f.photo === 'string' ? f.photo.trim() : '';
        if (currentPhoto && !isGeneratedFallbackPortrait(currentPhoto)) return;

        const mappedPortrait = findPortraitForName(f.name);
        if (!mappedPortrait) return;

        f.photo = mappedPortrait;
        if (!f.photo_key) {
            f.photo_key = `wwe2k24-${normalizeLookupKey(f.name)}`;
        }
        restored++;
    });

    if (restored > 0) {
        try {
            saveFighters(list);
        } catch (err) {
            console.warn('Failed to persist force-hydrated WWE 2K24 portraits', err);
        }
    }

    return restored;
}

window.forceHydrateAllPhotos = forceHydrateAllPhotos;

function isGeneratedFallbackPortrait(photo) {
    if (typeof photo !== 'string') return false;
    const value = photo.trim();
    if (!value.startsWith('data:image/svg+xml')) return false;

    let decoded = value;
    try {
        const encodedPayload = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value;
        decoded = decodeURIComponent(encodedPayload);
    } catch {
        decoded = value;
    }

    return decoded.includes('portraitBg') || decoded.includes('rgba(255,255,255,0.18)') || decoded.includes('text-anchor="middle"') || decoded.includes('text-anchor="middle"') || decoded.includes('fill="url(#portraitBg)"');
}

function shouldPreferRecoveredPhoto(currentPhoto, recoveredPhoto) {
    if (!recoveredPhoto || typeof recoveredPhoto !== 'string') return false;
    if (!recoveredPhoto.startsWith('data:image')) return false;
    if (isGeneratedFallbackPortrait(recoveredPhoto)) return false;
    if (!currentPhoto || typeof currentPhoto !== 'string' || currentPhoto.trim().length === 0) return true;
    if (isGeneratedFallbackPortrait(currentPhoto)) return true;
    return false;
}

function sanitizeSvgText(value, fallback = 'F') {
    if (value === null || value === undefined) return fallback;

    const text = Array.from(String(value).normalize('NFC')).filter((char) => {
        const code = char.codePointAt(0);
        if (code === undefined) return false;
        if (code < 0x20 || code === 0x7F) return false;
        if (code >= 0xD800 && code <= 0xDFFF) return false;
        if (code >= 0x2600 && code <= 0x27BF) return false;
        if (code === 0xFE0F) return false;
        if (code >= 0x1F300 && code <= 0x1FAFF) return false;
        return true;
    }).join('').trim();

    return text || fallback;
}

function buildFallbackPortraitDataUrl(name, gender = 'male') {
    const rawName = sanitizeSvgText(name, 'Fighter');
    const safeName = rawName.split(/\s+/).filter(Boolean).slice(0, 2).join(' ') || 'Fighter';
    const initials = safeName
        .split(/\s+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase())
        .join('') || 'F';
    const accentA = gender === 'female' ? '#f472b6' : '#60a5fa';
    const accentB = gender === 'female' ? '#7c3aed' : '#1d4ed8';
    const textColor = '#ffffff';
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
            <defs>
                <linearGradient id="portraitBg" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stop-color="${accentA}"/>
                    <stop offset="100%" stop-color="${accentB}"/>
                </linearGradient>
            </defs>
            <rect width="200" height="200" rx="100" fill="url(#portraitBg)"/>
            <circle cx="100" cy="74" r="42" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.4)" stroke-width="3"/>
            <path d="M52 156c10-24 32-36 48-36s38 12 48 36" fill="rgba(255,255,255,0.14)"/>
            <text x="100" y="123" text-anchor="middle" font-size="44" font-family="Arial, sans-serif" font-weight="700" fill="${textColor}">${initials}</text>
        </svg>
    `;

    try {
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    } catch (err) {
        const safeSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                <rect width="200" height="200" rx="100" fill="#60a5fa"/>
                <text x="100" y="123" text-anchor="middle" font-size="44" font-family="Arial, sans-serif" font-weight="700" fill="#ffffff">F</text>
            </svg>
        `;
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(safeSvg)}`;
    }
}

function purgeGeneratedPlaceholderPhotos(list = fighters) {
    if (!Array.isArray(list)) return 0;
    let updated = 0;
    list.forEach(f => {
        if (!f || typeof f !== 'object') return;
        const photo = typeof f.photo === 'string' ? f.photo.trim() : '';
        if (!photo || !isGeneratedFallbackPortrait(photo)) return;
        const mapped = getWWE2K24Portrait(f.name);
        // Do not overwrite if the fighter already has a valid custom photo assigned (in-memory or DOM)
        if (hasValidAssignedPhoto(f)) return;
        if (mapped) {
            f.photo = mapped;
            updated++;
        } else if (f.name) {
            f.photo = '';
            updated++;
        }
    });
    if (updated > 0) {
        try {
            saveFighters(list);
        } catch (err) {
            console.warn('Failed to purge generated placeholder photos', err);
        }
    }
    return updated;
}

// In-memory session cache for photos stored in IndexedDB to avoid flashes
window._fighterPhotoCache = window._fighterPhotoCache || Object.create(null);

async function preloadPhotoCache() {
    try {
        if (!('indexedDB' in window)) return 0;
        const db = await openFighterPhotoDB();
        return new Promise((resolve) => {
            const tx = db.transaction('photos', 'readonly');
            const store = tx.objectStore('photos');
            const req = store.openCursor();
            let count = 0;
            req.onsuccess = () => {
                const cursor = req.result;
                if (cursor) {
                    try {
                        const key = String(cursor.key);
                        const val = cursor.value;
                        if (typeof val === 'string' && val.startsWith('data:image')) {
                            window._fighterPhotoCache[key] = val;
                            count++;
                        }
                    } catch (e) {}
                    cursor.continue();
                    return;
                }
                // flag that cache preload completed
                window._fighterPhotoCacheLoaded = true;
                resolve(count);
            };
            req.onerror = () => resolve(0);
        });
    } catch (e) {
        return 0;
    }
}

function ensureMissingPortraits(list = fighters, persist = true) {
    if (!Array.isArray(list)) return false;
    let changed = false;
    list.forEach(f => {
        if (!f || typeof f !== 'object') return;
        // If a valid custom photo is already assigned (either in-memory, cached, or in the DOM), do not overwrite
        if (hasValidAssignedPhoto(f)) return;
        let portrait = '';
        try {
            portrait = getWWE2K24Portrait(f.name) || buildFallbackPortraitDataUrl(f.name, f.gender || 'male');
        } catch (err) {
            console.warn('Failed to build fallback portrait for', f.name, err);
        }
        if (portrait) {
            f.photo = portrait;
            changed = true;
        }
    });
    if (changed && persist) {
        try {
            saveFighters(list);
        } catch (err) {
            console.warn('Failed to save recovered fighter portraits', err);
        }
    }
    return changed;
}

function normalizeDivisionName(division) {
    const normalized = (division || '').toString().trim().toLowerCase();
    if (normalized.includes('cruiser')) return 'Cruiser Weight';
    if (normalized.includes('light heavy')) return 'Light HeavyWeight';
    if (normalized.includes('super heavy')) return 'Super HeavyWeight';
    if (normalized.includes('heavy')) return 'HeavyWeight';
    return division || 'HeavyWeight';
}

function sanitizeStoredPhoto(photo, name) {
    const value = typeof photo === 'string' ? photo.trim() : '';
    if (!value) return '';
    if (isGeneratedFallbackPortrait(value)) {
        const mapped = getWWE2K24Portrait(name);
        return mapped || '';
    }
    return value;
}

// Returns true if the photo value looks like a real user-provided image (data URL, http, blob)
function isCustomPhotoValue(photo) {
    if (typeof photo !== 'string') return false;
    const v = photo.trim();
    if (!v) return false;
    if (isGeneratedFallbackPortrait(v)) return false;
    return v.startsWith('data:image/') || v.startsWith('http://') || v.startsWith('https://') || v.startsWith('blob:');
}

function domHasAssignedPhoto(fighter) {
    try {
        if (!fighter || !fighter.id) return false;
        const el = document.getElementById(`fighter-card-${fighter.id}`);
        if (!el) return false;
        const img = el.querySelector('img');
        if (!img || !img.src) return false;
        const src = String(img.src || '').trim();
        if (!src) return false;
        if (isGeneratedFallbackPortrait(src)) return false;
        return src.startsWith('data:image/') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:');
    } catch (e) {
        return false;
    }
}

function hasValidAssignedPhoto(fighter) {
    if (!fighter) return false;
    if (isCustomPhotoValue(fighter.photo)) return true;
    if (isCustomPhotoValue(fighter.photo_key && window._fighterPhotoCache && window._fighterPhotoCache[String(fighter.photo_key)] ? window._fighterPhotoCache[String(fighter.photo_key)] : '')) return true;
    if (domHasAssignedPhoto(fighter)) return true;
    return false;
}

function getMappedDivisionForName(name) {
    return maleDivisionLookupNormalized[normalizeLookupKey(name)] || null;
}

function assignAutoDivision(list) {
    if (!Array.isArray(list)) return false;
    let rosterChanged = false;
    list.forEach(f => {
        if (!f || typeof f !== 'object') return;
        const gender = (f.gender || 'male').toString().toLowerCase();
        if (gender === 'female') return;
        const mappedDivision = getMappedDivisionForName(f.name);
        // If there's no mapped division or the mapping is an unknown placeholder, skip
        if (!mappedDivision) return;
        const mappedTrim = (mappedDivision || '').toString().trim();
        if (!mappedTrim || mappedTrim === '???') return;
        const canonicalDivision = normalizeDivisionName(mappedDivision);
        // Do not overwrite an explicit/manual division choice. Only assign if empty.
        if (!f.division || (typeof f.division === 'string' && f.division.trim() === '')) {
            f.division = canonicalDivision;
            rosterChanged = true;
        }
    });
    return rosterChanged;
}

function getRosterCareerPeakWinStreak(fighter) {
    let historyPeak = 0;
    [fighter?.compiled_history_deck, fighter?.history_deck, fighter?.history].forEach(history => {
        if (!Array.isArray(history)) return;
        history.forEach(entry => {
            historyPeak = Math.max(
                historyPeak,
                Math.floor(Number(entry?.winStreak) || 0),
                Math.floor(Number(entry?.win_streak) || 0)
            );
        });
    });
    return Math.max(
        0,
        Math.floor(Number(fighter?.peak_win_streak) || 0),
        Math.floor(Number(fighter?.win_streak) || 0),
        historyPeak
    );
}

function getRosterTitleRules() {
    const legacyMinimum = localStorage.getItem('titleWinMinimum') === '10' ? 10 : 5;
    let storedRules = {};
    const raw = localStorage.getItem('universeTitleRules');
    if (raw) {
        try {
            storedRules = JSON.parse(raw) || {};
        } catch (error) {
            console.error('Unable to read title eligibility rules in the roster.', error);
        }
    }
    return {
        initialTitleWins: Number(storedRules.initialTitleWins) === 10 ? 10
            : Number(storedRules.initialTitleWins) === 5 ? 5 : legacyMinimum,
        baseRebuildWins: [3, 4, 5].includes(Number(storedRules.baseRebuildWins))
            ? Number(storedRules.baseRebuildWins) : 3,
        extraLossPenalty: [1, 2, 3].includes(Number(storedRules.extraLossPenalty))
            ? Number(storedRules.extraLossPenalty) : 2
    };
}

function getRosterRebuildLossCount(fighter, required = fighter?.rebuild_wins_required) {
    if (!(Number(required) > 0)) return 0;
    const savedCount = Math.max(0, Math.floor(Number(fighter?.rebuild_loss_count) || 0));
    if (savedCount > 0) return savedCount;
    return Math.max(1, Math.ceil((Number(required) - 3) / 2) + 1);
}

function getRosterRebuildWinsRequired(lossCount, rules = getRosterTitleRules()) {
    if (!(Number(lossCount) > 0)) return 0;
    const cap = Math.min(15, Math.max(1, Number(rules.initialTitleWins) || 15));
    return Math.min(
        cap,
        Math.max(1, Number(rules.baseRebuildWins) || 3) +
            (Math.max(1, Math.floor(Number(lossCount) || 1)) - 1) * Math.max(1, Number(rules.extraLossPenalty) || 2)
    );
}

function normalizeRosterTitleGate(fighter, rules = getRosterTitleRules()) {
    let required = Math.max(0, Math.floor(Number(fighter?.rebuild_wins_required) || 0));
    let lossCount = getRosterRebuildLossCount(fighter, required);
    let comebackCompleted = fighter?.title_comeback_completed === true;
    let dominantExChampionRebuild = fighter?.dominant_ex_champ_rebuild === true;
    if (required > 0) {
        required = dominantExChampionRebuild ? 1 : getRosterRebuildWinsRequired(lossCount, rules);
        if (Math.max(0, Math.floor(Number(fighter?.win_streak) || 0)) >= required) {
            required = 0;
            lossCount = 0;
            comebackCompleted = true;
            dominantExChampionRebuild = false;
        } else {
            comebackCompleted = false;
        }
    } else {
        lossCount = 0;
        dominantExChampionRebuild = false;
    }
    return {
        rebuildWinsRequired: required,
        rebuildLossCount: lossCount,
        comebackCompleted,
        dominantExChampionRebuild
    };
}

function normalizeFighterRecord(fighter) {
    if (!fighter || typeof fighter !== 'object') return null;
    const normalized = { ...fighter };
    normalized.id = normalized.id || `f-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    normalized.name = (normalized.name || `${normalized.firstName || ''} ${normalized.lastName || ''}`.trim() || normalized.alias || 'Unnamed Fighter').trim();
    normalized.gender = (normalized.gender || 'male').toString().toLowerCase();
    normalized.division = normalizeDivisionName(normalized.division || normalized.weightClass || 'HeavyWeight');
    normalized.wins = Number(normalized.wins || 0);
    normalized.losses = Number(normalized.losses || 0);
    normalized.defenses = Number(normalized.defenses || 0);
    normalized.lifetime_defenses = Number(normalized.lifetime_defenses || 0);
    normalized.title_fights = Number(normalized.title_fights || 0);
    normalized.total_title_fights = Number(normalized.total_title_fights ?? normalized.title_fights);
    normalized.win_pinfall = Number(normalized.win_pinfall || 0);
    normalized.win_ko = Number(normalized.win_ko || 0);
    normalized.win_submission = Number(normalized.win_submission || 0);
    normalized.win_streak = Number(normalized.win_streak || 0);
    const titleGate = normalizeRosterTitleGate(normalized);
    normalized.rebuild_wins_required = titleGate.rebuildWinsRequired;
    normalized.rebuild_loss_count = titleGate.rebuildLossCount;
    normalized.title_comeback_completed = titleGate.comebackCompleted;
    normalized.dominant_ex_champ_rebuild = titleGate.dominantExChampionRebuild;
    normalized.peak_win_streak = getRosterCareerPeakWinStreak(normalized);
    normalized.is_boss = normalized.is_boss === true;
    normalized.boss_slays = Math.max(0, Math.floor(Number(normalized.boss_slays) || 0));
    if (Object.prototype.hasOwnProperty.call(normalized, 'lose_streak')) {
        normalized.lose_streak = Math.max(0, Math.floor(Number(normalized.lose_streak) || 0));
    } else {
        const historyCandidates = [
            normalized.compiled_history_deck,
            normalized.history_deck,
            normalized.history
        ];
        const history = historyCandidates.find(entries => Array.isArray(entries) && entries.length > 0) ||
            historyCandidates.find(entries => Array.isArray(entries)) ||
            [];
        let loseStreak = 0;
        if (Array.isArray(history)) {
            for (let index = history.length - 1; index >= 0; index--) {
                if (String(history[index]?.outcome || '').toLowerCase() !== 'loss') break;
                loseStreak++;
            }
        }
        normalized.lose_streak = loseStreak;
    }
    normalized.fotn_bonuses = Math.max(0, Math.floor(Number(normalized.fotn_bonuses) || 0));
    normalized.potn_bonuses = Math.max(0, Math.floor(Number(normalized.potn_bonuses) || 0));
    normalized.career_bonuses = normalized.fotn_bonuses + normalized.potn_bonuses;
    normalized.fast_tracked = normalized.fast_tracked === true;
    normalized.retired = normalized.retired === true;
    delete normalized.team;
    delete normalized.partner;
    delete normalized.family;
    normalized.photo_key = normalized.photo_key || normalized.photoKey || '';
    normalized.photo = sanitizeStoredPhoto(normalized.photo, normalized.name);
    return normalized;
}

async function openFighterPhotoDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('wwe_fighter_photos', 1);
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('photos')) {
                db.createObjectStore('photos');
            }
        };
        request.onsuccess = function(event) {
            resolve(event.target.result);
        };
        request.onerror = function(event) {
            reject(event.target.error || new Error('IndexedDB open failed'));
        };
    });
}

async function storeFighterPhotoInIDB(key, photoData) {
    const db = await openFighterPhotoDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('photos', 'readwrite');
        const store = tx.objectStore('photos');
        const request = store.put(photoData, key);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error || new Error('Failed to save fighter photo in IndexedDB'));
    });
}

async function loadFighterPhotoFromIDB(key) {
    if (!key) return null;
    try {
        const db = await openFighterPhotoDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('photos', 'readonly');
            const store = tx.objectStore('photos');
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error || new Error('Failed to load fighter photo from IndexedDB'));
        });
    } catch (err) {
        return null;
    }
}

async function deleteFighterPhotoFromIDB(key) {
    if (!key) return;
    try {
        const db = await openFighterPhotoDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('photos', 'readwrite');
            const store = tx.objectStore('photos');
            const request = store.delete(key);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error || new Error('Failed to delete fighter photo from IndexedDB'));
        });
    } catch (err) {
        console.warn('deleteFighterPhotoFromIDB failed', err);
        return null;
    }
}

async function migrateExistingPhotosToIDB() {
    const fightersToMigrate = fighters.filter(f => f.photo && f.photo.startsWith('data:image') && !f.photo_key);
    if (fightersToMigrate.length === 0) return 0;
    const db = await openFighterPhotoDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('photos', 'readwrite');
        const store = tx.objectStore('photos');
        const pendingUpdates = [];

        fightersToMigrate.forEach(f => {
            const key = `fighter-photo-${f.id}`;
            store.put(f.photo, key);
            pendingUpdates.push({ fighter: f, key, photo: f.photo });
        });

        tx.oncomplete = () => {
            // Keep the in-memory `photo` value so the UI remains visible immediately.
            // Persist the key so future loads may hydrate from IndexedDB.
            pendingUpdates.forEach(update => {
                update.fighter.photo_key = update.key;
            });
            try {
                saveFighters(fighters);
            } catch (err) {
                console.warn('Failed to save fighter list during photo migration', err);
            }
            resolve(fightersToMigrate.length);
        };

        tx.onerror = () => {
            pendingUpdates.forEach(update => {
                update.fighter.photo = update.photo;
            });
            reject(tx.error || new Error('Failed to migrate existing photos to IndexedDB'));
        };
    });
}

// Persist any inline data-URL photos into IndexedDB while keeping them in-memory
async function persistInlinePhotosToIDB() {
    if (!Array.isArray(fighters) || fighters.length === 0) return 0;
    if (!('indexedDB' in window)) return 0;
    let migrated = 0;
    for (const f of fighters) {
        try {
            const inline = typeof f.photo === 'string' ? f.photo.trim() : '';
            if (!inline || !inline.startsWith('data:image')) continue;
            const key = f.photo_key || `fighter-photo-${f.id}`;
            // If cache already has it, skip
            if (window._fighterPhotoCache && window._fighterPhotoCache[String(key)]) {
                f.photo_key = f.photo_key || key;
                continue;
            }
            await storeFighterPhotoInIDB(key, inline);
            // set photo_key but keep f.photo so UI does not lose the image
            f.photo_key = key;
            // also prime the session cache for immediate renders
            window._fighterPhotoCache = window._fighterPhotoCache || Object.create(null);
            window._fighterPhotoCache[String(key)] = inline;
            migrated++;
        } catch (e) {
            console.warn('persistInlinePhotosToIDB failed for', f && f.id, e);
        }
    }
    if (migrated > 0) {
        try { saveFighters(fighters); } catch (e) { /* non-fatal */ }
    }
    return migrated;
}

async function hydrateRosterFighterPhotos() {
    let loadedAny = false;
    await Promise.all(fighters.map(async f => {
        // Only hydrate from IDB when there is no valid assigned photo (in-memory or DOM)
        if (!hasValidAssignedPhoto(f) && f.photo_key) {
            const photo = await loadFighterPhotoFromIDB(f.photo_key);
            if (photo) {
                f.photo = photo;
                loadedAny = true;
            }
        }
    }));
    if (loadedAny) {
        saveFighters(fighters);
    }
    return loadedAny;
}

async function loadRosterPortraitsForDisplay() {
    window._fighterPhotoCache = window._fighterPhotoCache || Object.create(null);
    await Promise.all(fighters.map(async fighter => {
        if (isCustomPhotoValue(fighter.image) || isCustomPhotoValue(fighter.profile_pic) || isCustomPhotoValue(fighter.photo)) return;
        const normalizedName = normalizeLookupKey(fighter.name);
        const keys = [
            fighter.photo_key,
            fighter.photoKey,
            fighter.id && `fighter-photo-${fighter.id}`,
            normalizedName && `fighter-photo-${normalizedName}`,
            normalizedName && `wwe2k24-${normalizedName}`
        ].filter((key, index, list) => key && list.indexOf(key) === index);

        for (const key of keys) {
            const cacheKey = String(key);
            const cachedPhoto = window._fighterPhotoCache[cacheKey];
            if (isCustomPhotoValue(cachedPhoto)) {
                fighter.photo = cachedPhoto;
                return;
            }

            const photo = await loadFighterPhotoFromIDB(cacheKey);
            if (isCustomPhotoValue(photo)) {
                window._fighterPhotoCache[cacheKey] = photo;
                fighter.photo = photo;
                return;
            }
        }
    }));
}

function recoverPortraitsFromLocalStorage() {
    let restored = 0;
    const candidates = [];

    const inspectValue = (value) => {
        if (!value || typeof value !== 'object') return;
        if (Array.isArray(value)) {
            value.forEach(inspectValue);
            return;
        }
        const photo = typeof value.photo === 'string' ? value.photo.trim() : '';
        const hasPhoto = photo.length > 0 && photo.startsWith('data:image');
        const hasIdOrName = typeof value.id === 'string' || typeof value.name === 'string';
        if (hasPhoto && hasIdOrName && !isGeneratedFallbackPortrait(photo)) {
            candidates.push(value);
        }
        Object.values(value).forEach(inspectValue);
    };

    Object.keys(localStorage).forEach(key => {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            inspectValue(parsed);
        } catch (e) {
            // ignore non-JSON values
        }
    });

    candidates.forEach(candidate => {
        if (!candidate.photo || typeof candidate.photo !== 'string') return;
        const matchById = candidate.id ? fighters.find(f => f.id === candidate.id) : null;
        const matchByName = candidate.name ? fighters.find(f => f.name.toLowerCase() === candidate.name.toLowerCase()) : null;
        const fighter = matchById || matchByName;
        if (fighter && !hasValidAssignedPhoto(fighter) && shouldPreferRecoveredPhoto(fighter.photo, candidate.photo)) {
            fighter.photo = candidate.photo;
            if (candidate.photo_key) fighter.photo_key = candidate.photo_key;
            restored++;
        }
    });

    if (restored > 0) {
        saveFighters(fighters);
    }
    return restored;
}

async function recoverPortraitsFromIndexedDB() {
    try {
        if (!('indexedDB' in window)) return 0;
        const db = await openFighterPhotoDB();
        return new Promise((resolve) => {
            const tx = db.transaction('photos', 'readonly');
            const store = tx.objectStore('photos');
            const request = store.openCursor();
            const valuesByKey = new Map();
            let restored = 0;

            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    const value = cursor.value;
                    if (typeof value === 'string' && value.startsWith('data:image') && !isGeneratedFallbackPortrait(value)) {
                        valuesByKey.set(String(cursor.key), value);
                    }
                    cursor.continue();
                    return;
                }

                fighters.forEach(fighter => {
                    const photoKey = fighter.photo_key || `fighter-photo-${fighter.id}`;
                    const matches = valuesByKey.get(String(photoKey));
                    if (matches && !hasValidAssignedPhoto(fighter) && shouldPreferRecoveredPhoto(fighter.photo, matches)) {
                        fighter.photo = matches;
                        fighter.photo_key = photoKey;
                        restored++;
                    }
                });

                if (restored > 0) {
                    saveFighters(fighters);
                }
                resolve(restored);
            };

            request.onerror = () => resolve(0);
        });
    } catch (err) {
        return 0;
    }
}

function migrateLegacyFighters() {
    const legacy = localStorage.getItem('fighters');
    const current = localStorage.getItem('wwe_fighters');
    if (!legacy || current) return;
    try {
        const parsedLegacy = JSON.parse(legacy);
        if (!Array.isArray(parsedLegacy)) return;
        const normalizedLegacy = parsedLegacy.map(normalizeFighterRecord).filter(Boolean);
        localStorage.setItem('wwe_fighters', JSON.stringify(normalizedLegacy));
        localStorage.removeItem('fighters');
    } catch {
        // keep current state if legacy parse fails
    }
}

function loadFighters() {
    migrateLegacyFighters();
    const stored = localStorage.getItem('wwe_fighters');
    if (!stored) return hardcodedRosterBackup.map(normalizeFighterRecord).filter(Boolean);
    try {
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];
        const normalizedRecords = parsed.map(normalizeFighterRecord);
        const normalized = normalizedRecords.filter(Boolean);
        const bonusesNeedMigration = parsed.some((fighter, index) =>
            !fighter || typeof fighter !== 'object' ||
            Number(fighter.fotn_bonuses) !== normalizedRecords[index]?.fotn_bonuses ||
            Number(fighter.potn_bonuses) !== normalizedRecords[index]?.potn_bonuses ||
            Number(fighter.career_bonuses) !== normalizedRecords[index]?.career_bonuses
        );
        const loseStreakNeedsMigration = parsed.some((fighter, index) =>
            fighter && typeof fighter === 'object' &&
            Number(fighter.lose_streak) !== normalizedRecords[index]?.lose_streak
        );
        const peakWinStreakNeedsMigration = parsed.some((fighter, index) =>
            fighter && typeof fighter === 'object' &&
            Number(fighter.peak_win_streak) !== normalizedRecords[index]?.peak_win_streak
        );
        const titleGateNeedsMigration = parsed.some((fighter, index) =>
            !fighter || typeof fighter !== 'object' ||
            Number(fighter.rebuild_wins_required) !== normalizedRecords[index]?.rebuild_wins_required ||
            Number(fighter.rebuild_loss_count) !== normalizedRecords[index]?.rebuild_loss_count ||
            fighter.title_comeback_completed !== normalizedRecords[index]?.title_comeback_completed ||
            fighter.dominant_ex_champ_rebuild !== normalizedRecords[index]?.dominant_ex_champ_rebuild
        );
        if (bonusesNeedMigration || loseStreakNeedsMigration || peakWinStreakNeedsMigration || titleGateNeedsMigration) {
            const migrated = parsed.map((fighter, index) => fighter && typeof fighter === 'object'
                ? {
                    ...fighter,
                    lose_streak: normalizedRecords[index]?.lose_streak || 0,
                    peak_win_streak: normalizedRecords[index]?.peak_win_streak || 0,
                    fotn_bonuses: normalizedRecords[index]?.fotn_bonuses || 0,
                    potn_bonuses: normalizedRecords[index]?.potn_bonuses || 0,
                    career_bonuses: normalizedRecords[index]?.career_bonuses || 0,
                    rebuild_wins_required: normalizedRecords[index]?.rebuild_wins_required || 0,
                    rebuild_loss_count: normalizedRecords[index]?.rebuild_loss_count || 0,
                    title_comeback_completed: normalizedRecords[index]?.title_comeback_completed === true,
                    dominant_ex_champ_rebuild: normalizedRecords[index]?.dominant_ex_champ_rebuild === true
                }
                : fighter);
            try {
                localStorage.setItem('wwe_fighters', JSON.stringify(migrated));
            } catch (error) {
                console.error('Unable to initialize career performance bonus counters.', error);
            }
        }
        return normalized;
    } catch {
        return [];
    }
}

function syncFighterRecordsFromHistory(list) {
    let changed = false;

    list.forEach(fighter => {
        if (fighter.manual_stats_override === true) return;
        const historyCandidates = [
            fighter.compiled_history_deck,
            fighter.history_deck,
            fighter.history
        ];
        const history = historyCandidates.find(entries => Array.isArray(entries) && entries.length > 0);
        if (!history) return;

        const wins = history.filter(entry => (entry?.outcome || '').toLowerCase() === 'win').length;
        const losses = history.filter(entry => (entry?.outcome || '').toLowerCase() === 'loss').length;
        if (wins + losses === 0) return;

        if (Number(fighter.wins || 0) !== wins || Number(fighter.losses || 0) !== losses) {
            fighter.wins = wins;
            fighter.losses = losses;
            changed = true;
        }
    });

    return changed;
}

// Paste the array from a downloaded roster backup here to restore it without browser storage.
const hardcodedRosterBackup = [];

async function loadAndHydrateFighters() {
    fighters = loadFighters();
    await loadRosterPortraitsForDisplay();
    if (syncFighterRecordsFromHistory(fighters)) {
        saveFighters(fighters);
    }
    purgeGeneratedPlaceholderPhotos(fighters);
    recoverPortraitsFromLocalStorage();
    return fighters;
}

// Ensure fighters are loaded, with a small retry loop for bfcache/timing issues
async function ensureFightersLoaded(maxAttempts = 4, delayMs = 120) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await loadAndHydrateFighters();
        if (Array.isArray(fighters) && fighters.length > 0) {
            console.debug(`ensureFightersLoaded: success on attempt ${attempt}, count=${fighters.length}`);
            return fighters;
        }
        console.debug(`ensureFightersLoaded: attempt ${attempt} found 0 fighters, retrying after ${delayMs}ms`);
        await new Promise(r => setTimeout(r, delayMs));
    }
    console.debug('ensureFightersLoaded: attempts exhausted, fighters count=', fighters.length);
    return fighters;
}

function saveFighters(list = fighters) {
    if (window.wweUniverseResetInProgress) return;
    const normalized = (list || []).map(normalizeFighterRecord).filter(Boolean);
    assignAutoDivision(normalized);
    const payload = normalized.map(f => ({
        ...f,
        photo: sanitizeStoredPhoto(f.photo, f.name),
        photo_key: f.photo_key || ''
    }));
    try {
        localStorage.setItem('wwe_fighters', JSON.stringify(payload));
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('wwe_fighters:changed', {
                detail: { source: 'roster.js', count: payload.length }
            }));
        }
    } catch (err) {
        if (err && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || err.code === 22 || err.code === 1014)) {
            const fallbackPayload = payload.map(f => {
                if (!f || typeof f !== 'object') return f;
                if (typeof f.photo === 'string' && f.photo.startsWith('data:image')) {
                    const targetKey = f.photo_key || `fighter-photo-${f.id}`;
                    if (typeof window !== 'undefined' && 'indexedDB' in window) {
                        openFighterPhotoDB().then(db => {
                            const tx = db.transaction('photos', 'readwrite');
                            const store = tx.objectStore('photos');
                            store.put(f.photo, targetKey);
                        }).catch(() => {});
                    }
                    return { ...f, photo: '', photo_key: targetKey };
                }
                return f;
            });
            try {
                localStorage.setItem('wwe_fighters', JSON.stringify(fallbackPayload));
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('wwe_fighters:changed', {
                        detail: { source: 'roster.js-fallback', count: fallbackPayload.length }
                    }));
                }
            } catch (innerErr) {
                console.error('Failed to save fighters after moving inline photos to IndexedDB:', innerErr);
            }
            return;
        }
        console.error('Failed to save fighters:', err);
    }
}

const TITLE_DEFENSE_AUDIT_KEY = 'wwe_title_defenses_audit_v1';

function auditTitleDefenses() {
    const auditLifetimeKey = 'wwe_lifetime_title_defenses_audit_v1';
    const auditAlreadyComplete = localStorage.getItem(TITLE_DEFENSE_AUDIT_KEY) === 'complete';
    if (!Array.isArray(fighters) || fighters.length === 0) return false;

    let eventHistory;
    let championships;
    try {
        eventHistory = JSON.parse(localStorage.getItem('wwe_event_history') || '[]');
        championships = JSON.parse(localStorage.getItem('wwe_titles') || '[]');
    } catch (error) {
        console.error('Unable to audit title defenses because saved title history is invalid.', error);
        return false;
    }
    if (!Array.isArray(eventHistory) || !Array.isArray(championships)) {
        console.error('Unable to audit title defenses because saved title history has an unexpected format.');
        return false;
    }

    const normalize = value => String(value || '').trim().toLowerCase();
    const fighterByName = new Map(fighters.map(fighter => [normalize(fighter.name), fighter]));
    const fighterById = new Map(fighters.map(fighter => [fighter.id, fighter]));
    const titleFightTotals = new Map(fighters.map(fighter => [fighter.id, 0]));
    const archivedShowIds = new Set();
    const archivedShowNames = new Set();
    const resolveFighter = (id, name) => (id && fighterById.get(id)) || fighterByName.get(normalize(name || ''));
    const countTitleMatchAppearances = match => {
        if (!match || match.isTitle !== true) return;
        const fighter1 = resolveFighter(
            match.slot1Id || match.fighter1Id || match.winnerId,
            match.slot1Name || match.fighter1Name || match.winner || match.winnerName
        );
        const fighter2 = resolveFighter(
            match.slot2Id || match.fighter2Id || match.loserId,
            match.slot2Name || match.fighter2Name || match.loser || match.loserName
        );
        if (fighter1) titleFightTotals.set(fighter1.id, (titleFightTotals.get(fighter1.id) || 0) + 1);
        if (fighter2 && fighter2.id !== fighter1?.id) {
            titleFightTotals.set(fighter2.id, (titleFightTotals.get(fighter2.id) || 0) + 1);
        }
    };
    eventHistory.forEach(event => {
        if (!event || !Array.isArray(event.matches)) return;
        if (event.showId) archivedShowIds.add(String(event.showId));
        const showName = normalize(event.showTitle || event.name);
        if (showName) archivedShowNames.add(showName);
        event.matches.forEach(countTitleMatchAppearances);
    });
    Object.keys(localStorage).forEach(key => {
        if (!key.startsWith('wwe_matches_')) return;
        const showId = key.slice('wwe_matches_'.length);
        if (archivedShowIds.has(showId)) return;
        let savedMatches;
        try {
            savedMatches = JSON.parse(localStorage.getItem(key) || '{}');
        } catch (error) {
            console.error(`Unable to read saved match results for title-fight audit (${key}).`, error);
            return;
        }
        if (!savedMatches || typeof savedMatches !== 'object' || Array.isArray(savedMatches)) return;
        Object.values(savedMatches).forEach(match => {
            const showName = normalize(match?.showName || match?.showTitle);
            if (showName && archivedShowNames.has(showName)) return;
            countTitleMatchAppearances(match);
        });
    });
    const titleStates = new Map();
    const defenseTotals = new Map();
    const lifetimeDefenseTotals = new Map();
    const orderedEvents = eventHistory
        .map((event, index) => ({
            event,
            index,
            timestamp: event && typeof event === 'object' ? Date.parse(event.completedAt || event.date || '') : NaN
        }))
        .filter(item => item.event && Array.isArray(item.event.matches))
        .sort((a, b) => Number.isFinite(a.timestamp) && Number.isFinite(b.timestamp)
            ? a.timestamp - b.timestamp || a.index - b.index
            : a.index - b.index);

    championships.forEach(title => {
        if (!title || !title.id) return;
        const history = Array.isArray(title.history) ? title.history : [];
        const transferCounts = new Map();
        const manualChanges = new Map();
        history.forEach(entry => {
            if (!entry) return;
            const key = `${normalize(entry.showTitle)}|${normalize(entry.wrestlerName)}`;
            if (normalize(entry.winMethod) === 'manual change') {
                const showKey = normalize(entry.showTitle);
                if (!manualChanges.has(showKey)) manualChanges.set(showKey, []);
                manualChanges.get(showKey).push(entry.wrestlerName);
                return;
            }
            transferCounts.set(key, (transferCounts.get(key) || 0) + 1);
        });
        titleStates.set(title.id, {
            title,
            holderId: '',
            activeReignDefenses: 0,
            transferCounts,
            manualChanges
        });
    });

    let eventHistoryChanged = false;
    orderedEvents.forEach(({ event }) => {
        const showName = event.showTitle || event.name || '';
        const normalizedShowName = normalize(showName);
        titleStates.forEach(state => {
            const changes = state.manualChanges.get(normalizedShowName);
            if (!changes || changes.length === 0) return;
            const manualChampion = fighterByName.get(normalize(changes.shift()));
            if (!manualChampion) return;
            state.holderId = manualChampion.id;
            state.activeReignDefenses = 0;
        });

        event.matches.forEach(match => {
            if (!match || !match.isTitle || !(match.winner || match.winnerName)) return;

            let title = match.titleId ? championships.find(item => item && item.id === match.titleId) : null;
            if (!title) {
                const titleName = normalize(match.customTitleName || match.titleName);
                if (titleName) title = championships.find(item => item && normalize(item.name) === titleName);
            }
            if (!title) return;

            const state = titleStates.get(title.id);
            const winner = (match.winnerId && fighterById.get(match.winnerId)) ||
                fighterByName.get(normalize(match.winner || match.winnerName));
            if (!state || !winner) return;

            const transferKey = `${normalize(showName)}|${normalize(winner.name)}`;
            const matchingTransfers = state.transferCounts.get(transferKey) || 0;
            const isRecordedTitleChange = matchingTransfers > 0;
            if (isRecordedTitleChange) {
                state.transferCounts.set(transferKey, matchingTransfers - 1);
            }

            const currentChampion = fighterById.get(state.holderId);
            const winnerMatchesCurrentChampion = currentChampion &&
                String(winner.name || '').trim().toLowerCase() === String(currentChampion.name || '').trim().toLowerCase();
            if (match.titleRetained === true || winnerMatchesCurrentChampion) {
                defenseTotals.set(winner.id, (defenseTotals.get(winner.id) || 0) + 1);
                lifetimeDefenseTotals.set(winner.id, (lifetimeDefenseTotals.get(winner.id) || 0) + 1);
                state.activeReignDefenses += 1;
                state.holderId = winner.id;
                if (match.titleRetained !== true) {
                    match.titleRetained = true;
                    eventHistoryChanged = true;
                }
                if (match.lifetimeDefenseCounted !== true) {
                    match.lifetimeDefenseCounted = true;
                    eventHistoryChanged = true;
                }
            } else if (match.titleRetained === false || isRecordedTitleChange) {
                state.holderId = winner.id;
                state.activeReignDefenses = 0;
            } else if (state.holderId) {
                state.holderId = winner.id;
                state.activeReignDefenses = 0;
            }
        });
    });

    let fighterStatsChanged = false;
    fighters.forEach(fighter => {
        if (fighter.manual_stats_override === true) return;
        const auditedTitleFights = titleFightTotals.get(fighter.id) || 0;
        if (Number(fighter.total_title_fights || 0) !== auditedTitleFights ||
            Number(fighter.title_fights || 0) !== auditedTitleFights) {
            fighter.total_title_fights = auditedTitleFights;
            fighter.title_fights = auditedTitleFights;
            fighterStatsChanged = true;
        }
    });
    const allDefenseFighterIds = new Set([...defenseTotals.keys(), ...lifetimeDefenseTotals.keys()]);
    fighters.forEach(fighter => allDefenseFighterIds.add(fighter.id));
    allDefenseFighterIds.forEach(fighterId => {
        const fighter = fighterById.get(fighterId);
        if (!fighter || fighter.manual_stats_override === true) return;
        const currentDefenses = Number(fighter.defenses) || 0;
        const auditedDefenses = defenseTotals.get(fighterId) || 0;
        const auditedLifetimeDefenses = lifetimeDefenseTotals.get(fighterId) || 0;
        if (!auditAlreadyComplete && auditedDefenses > currentDefenses) {
            fighter.defenses = auditedDefenses;
            fighterStatsChanged = true;
        }
        if (Number(fighter.lifetime_defenses || 0) !== auditedLifetimeDefenses) {
            fighter.lifetime_defenses = auditedLifetimeDefenses;
            fighterStatsChanged = true;
        }
    });

    let titleStatsChanged = false;
    titleStates.forEach(state => {
        if (state.holderId !== state.title.championId || state.activeReignDefenses <= Number(state.title.defenses || 0)) return;
        state.title.defenses = state.activeReignDefenses;
        titleStatsChanged = true;
    });

    try {
        if (fighterStatsChanged) saveFighters(fighters);
        if (titleStatsChanged) localStorage.setItem('wwe_titles', JSON.stringify(championships));
        if (eventHistoryChanged) localStorage.setItem('wwe_event_history', JSON.stringify(eventHistory));
        if (fighterStatsChanged) {
            const savedFighters = JSON.parse(localStorage.getItem('wwe_fighters') || '[]');
            if (!Array.isArray(savedFighters) ||
                Array.from(defenseTotals).some(([id, count]) => {
                    const fighter = savedFighters.find(item => item.id === id);
                    return !fighter || (fighter.manual_stats_override !== true && (Number(fighter.defenses) || 0) < count);
                }) ||
                Array.from(lifetimeDefenseTotals).some(([id, count]) => {
                    const fighter = savedFighters.find(item => item.id === id);
                    return !fighter || (fighter.manual_stats_override !== true && (Number(fighter.lifetime_defenses) || 0) < count);
                })) {
                throw new Error('Saved fighter defense totals did not match the audited values.');
            }
        }
        if (titleStatsChanged) {
            const savedTitles = JSON.parse(localStorage.getItem('wwe_titles') || '[]');
            if (!Array.isArray(savedTitles) || Array.from(titleStates.values()).some(state => {
                if (state.holderId !== state.title.championId) return false;
                const savedTitle = savedTitles.find(item => item.id === state.title.id);
                return !savedTitle || (Number(savedTitle.defenses) || 0) < state.activeReignDefenses;
            })) {
                throw new Error('Saved championship defense totals did not match the audited values.');
            }
        }
        if (!auditAlreadyComplete) localStorage.setItem(TITLE_DEFENSE_AUDIT_KEY, 'complete');
        localStorage.setItem(auditLifetimeKey, 'complete');
        return fighterStatsChanged || titleStatsChanged;
    } catch (error) {
        console.error('Unable to persist audited title defense totals.', error);
        return false;
    }
}

window.auditTitleDefenses = auditTitleDefenses;

function ensureFemaleRosterEntries() {
    fighters = loadFighters();
    if (fighters.length > 0) return;

    let rosterChanged = false;

    femaleFighterTemplates.forEach(template => {
        const existing = fighters.find(f => f.name.toLowerCase() === template.name.toLowerCase());
        if (!existing) {
            fighters.push(normalizeFighterRecord({
                id: `f-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
                name: template.name,
                gender: 'female',
                division: template.division,
                wins: 0,
                losses: 0,
                defenses: 0,
                title_fights: 0,
                win_pinfall: 0,
                win_ko: 0,
                win_submission: 0,
                photo: ''
            }));
            rosterChanged = true;
        }
    });

    const autoUpdated = assignAutoDivision(fighters);
    if (rosterChanged || autoUpdated) {
        saveFighters(fighters);
    }
}

// Keep a datalist of fighter names for quick autofill in the Master Roster form
function refreshFighterNameDatalist() {
    try {
        const names = loadFighters().map(f => f.name).filter(Boolean);
        let data = document.getElementById('fighterNamesList');
        if (!data) {
            data = document.createElement('datalist');
            data.id = 'fighterNamesList';
            document.body.appendChild(data);
        }
        data.innerHTML = '';
        names.forEach(n => {
            const opt = document.createElement('option');
            opt.value = n;
            data.appendChild(opt);
        });

        const nameInput = document.getElementById('fighterName');
        if (nameInput) nameInput.setAttribute('list', 'fighterNamesList');
    } catch (e) {
        // non-fatal
        console.error('datalist refresh failed', e);
    }
}

window.downloadAppBackup = function() {
    const backup = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('wwe_')) {
            backup[key] = localStorage.getItem(key);
        }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `wwe-universe-backup-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

window.saveEntireUniverseState = function(event) {
    event?.preventDefault();
    try {
        const storageSnapshot = Object.create(null);
        for (let index = 0; index < localStorage.length; index++) {
            const key = localStorage.key(index);
            if (key !== null) storageSnapshot[key] = localStorage.getItem(key);
        }

        const backup = {
            format: 'wwe-universe-master-backup',
            version: 1,
            exportedAt: new Date().toISOString(),
            localStorage: storageSnapshot
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'wwe_universe_master_backup.json';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
        console.error('Unable to export the complete WWE Universe backup.', error);
        alert('The complete Universe backup could not be created. Check browser storage and try again.');
    }
};

window.downloadRosterBackup = async function() {
    let roster = [];
    try {
        const stored = localStorage.getItem('wwe_fighters');
        const parsed = stored ? JSON.parse(stored) : fighters;
        if (!Array.isArray(parsed)) throw new Error('Roster data is not an array');
        roster = parsed.map(normalizeFighterRecord).filter(Boolean);
        await Promise.all(roster.map(async fighter => {
            if (fighter.photo || !fighter.photo_key) return;
            const storedPhoto = await loadFighterPhotoFromIDB(fighter.photo_key);
            if (storedPhoto) fighter.photo = storedPhoto;
        }));
    } catch (err) {
        alert('Could not read the roster data for export.');
        return;
    }

    const blob = new Blob([JSON.stringify(roster, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `wwe-roster-backup-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

window.importAppBackup = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(loadEvent) {
            try {
                const imported = JSON.parse(loadEvent.target.result);
                if (!imported || typeof imported !== 'object') throw new Error('Invalid backup format');
                let importedCount = 0;
                Object.keys(imported).forEach(key => {
                    if (key && key.startsWith('wwe_')) {
                        localStorage.setItem(key, imported[key]);
                        importedCount++;
                    }
                });
                if (importedCount === 0) {
                    return alert('No valid WWE backup data found in that file.');
                }
                alert(`Imported ${importedCount} WWE storage item${importedCount !== 1 ? 's' : ''}. Refreshing page now.`);
                location.reload();
            } catch (err) {
                console.error(err);
                alert('Backup import failed. Please select a valid JSON backup file.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

window.restoreLegacyRoster = async function() {
    await loadAndHydrateFighters();
    const legacyKeys = ['fighters'];
    let restored = 0;

    legacyKeys.forEach(key => {
        const raw = localStorage.getItem(key);
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return;

            parsed.map(normalizeFighterRecord).filter(Boolean).forEach(legacyFighter => {
                const exists = fighters.some(current => current.id === legacyFighter.id || current.name.toLowerCase() === legacyFighter.name.toLowerCase());
                if (!exists) {
                    fighters.push(legacyFighter);
                    restored++;
                }
            });
        } catch {
            return;
        }
    });

    if (restored > 0) {
        saveFighters(fighters);
        scheduleRenderRosterGrid();
        alert(`Restored ${restored} missing fighter${restored === 1 ? '' : 's'} from your legacy roster.`);
    } else {
        alert('No additional fighters were found in legacy roster data. Your current roster already has everything loaded.');
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const saveUniverseLink = document.getElementById('btnSaveUniverse');
    if (saveUniverseLink) {
        saveUniverseLink.addEventListener('click', window.saveEntireUniverseState);
    }
    try {
        await loadAndHydrateFighters();
        auditTitleDefenses();
    } catch (err) {
        console.warn('Photo DB migration/hydration failed', err);
    }
    ensureFemaleRosterEntries();
    ensureFighterHistoryButtonStyles();
    refreshFighterNameDatalist();
    renderRosterGrid();
    setupSidebarFormEngine();
    setupLiveSearchEngine();
    window.addEventListener('beforeunload', () => {
        if (!window.wweUniverseResetInProgress) saveFighters(fighters);
    });
    const refreshRosterStreakPortraits = () => {
        document.querySelectorAll('.roster-portrait-frame').forEach(frame => {
            const card = frame.closest('[id^="fighter-card-"]');
            const fighterId = card?.id.slice('fighter-card-'.length);
            const fighter = fighters.find(item => item.id === fighterId);
            if (fighter) applyRosterStreakPortraitClass(frame, fighter);
        });
    };
    window.addEventListener('focus', refreshRosterStreakPortraits);
    window.addEventListener('pageshow', refreshRosterStreakPortraits);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) refreshRosterStreakPortraits();
    });
    window.addEventListener('storage', event => {
        if (event.key !== 'wwe_fighters' && event.key !== 'fighters') return;
        fighters = loadFighters();
        window.fighters = fighters;
        scheduleRenderRosterGrid();
    });
    window.addEventListener('universeTitleRules:changed', () => {
        fighters = loadFighters();
        window.fighters = fighters;
        scheduleRenderRosterGrid(0);
    });
});

// Inject CSS for the fighter history button if not already present
function ensureFighterHistoryButtonStyles() {
    if (document.getElementById('fighter-history-button-styles')) return;
    const style = document.createElement('style');
    style.id = 'fighter-history-button-styles';
    style.textContent = `
        .fighter-history-btn,
        .fighter-analytics-btn {
            position: absolute;
            top: 8px;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(2,6,23,0.08);
            color: #0f172a;
            line-height: 1;
            padding: 0;
            z-index: 5;
        }
        .fighter-history-btn { right: 8px; }
        .fighter-analytics-btn { right: 52px; }
        .fighter-history-btn:hover,
        .fighter-analytics-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(2,6,23,0.12); }
        .fighter-history-btn:focus,
        .fighter-analytics-btn:focus { outline: 2px solid rgba(59,130,246,0.25); outline-offset: 2px; }
    `;
    document.head.appendChild(style);
}

window.openFighterHistory = function(fighterName) {
    try {
        if (fighterName) localStorage.setItem('wwe_history_search_query', String(fighterName));
    } catch (e) {}
    window.location.href = 'fighter-history.html';
};

window.openFighterAnalytics = function(fighterName) {
    try {
        if (fighterName) localStorage.setItem('wwe_analytics_focus_fighter', String(fighterName));
    } catch (e) {}
    window.location.href = 'charts.html';
};

function getRosterWinStreak(fighter) {
    if (typeof window.getCurrentWinStreak === 'function') return window.getCurrentWinStreak(fighter);
    if (!fighter) return 0;
    const wins = Number(fighter.wins || 0);
    const losses = Number(fighter.losses || 0);
    const activeStreak = losses === 0 ? wins : (fighter.win_streak || 0);
    return Number(activeStreak) || 0;
}

function getRosterTitleWinMinimum() {
    return getRosterTitleRules().initialTitleWins;
}

function getTitleEligibilityStatus(fighter) {
    const minimum = getRosterTitleWinMinimum();
    const winStreak = Math.max(0, Math.floor(Number(fighter?.win_streak) || 0));
    const rebuildWinsRequired = Math.max(0, Math.floor(Number(fighter?.rebuild_wins_required) || 0));
    if (rebuildWinsRequired > 0) {
        const remaining = Math.max(0, rebuildWinsRequired - winStreak);
        return {
            eligible: false,
            status: winStreak > 0 ? 'rebuilding' : 'locked',
            label: fighter?.dominant_ex_champ_rebuild === true && rebuildWinsRequired === 1
                ? `🟡 EX-CHAMP REBUILD (${winStreak}/1 WIN)`
                : winStreak > 0
                ? `🟡 REBUILDING (${winStreak}/${rebuildWinsRequired} WINS)`
                : `🔴 LOCKED (NEEDS ${rebuildWinsRequired}W)`,
            remaining
        };
    }
    if (fighter?.title_comeback_completed === true || winStreak >= minimum) {
        return { eligible: true, status: 'eligible', label: '🟢 TITLE ELIGIBLE', remaining: 0 };
    }
    return {
        eligible: false,
        status: 'contender',
        label: `⚪ CONTENDER (${winStreak}/${minimum}W)`,
        remaining: Math.max(0, minimum - winStreak)
    };
}

window.getTitleEligibilityStatus = getTitleEligibilityStatus;

function getStreakClass(fighter) {
    if (typeof window.getWinStreakPortraitClass === 'function') {
        return window.getWinStreakPortraitClass(fighter);
    }
    const calculatedStreak = getRosterWinStreak(fighter);
    if (calculatedStreak >= 47) return 'streak-tier-master-prestige';
    if (calculatedStreak >= 43) return 'streak-tier-blood-moon';
    if (calculatedStreak >= 39) return 'streak-tier-cyber';
    if (calculatedStreak >= 35) return 'streak-tier-cosmic';
    if (calculatedStreak >= 31) return 'streak-tier-hellfire';
    if (calculatedStreak >= 26) return 'streak-tier-lightning';
    if (calculatedStreak >= 22) return 'streak-tier-rainbow';
    if (calculatedStreak >= 18) return 'streak-tier-gold';
    if (calculatedStreak >= 13) return 'streak-tier-blue';
    if (calculatedStreak >= 7) return 'streak-tier-green';
    if (calculatedStreak >= 3) return 'streak-tier-purple';
    return '';
}

function applyRosterStreakPortraitClass(frame, fighter) {
    if (!frame) return;
    const streakClass = getStreakClass(fighter);
    if (typeof window.applyWinStreakPortraitClass === 'function') {
        window.applyWinStreakPortraitClass(frame, fighter);
    } else {
        frame.classList.add('portrait-frame-base');
        frame.classList.remove('streak-tier-purple', 'streak-tier-green', 'streak-tier-blue', 'streak-tier-gold', 'streak-tier-rainbow', 'streak-tier-lightning', 'streak-tier-hellfire', 'streak-tier-cosmic', 'streak-tier-cyber', 'streak-tier-blood-moon', 'streak-tier-master-prestige', 'streak-purple', 'streak-green', 'streak-blue', 'streak-rainbow-diamond', 'border-tier-1', 'border-tier-2', 'border-tier-3', 'border-tier-4');
        if (streakClass) frame.classList.add(streakClass);
    }

    const card = frame.closest('.fighter-card');
    if (card) {
        card.classList.remove('streak-tier-purple', 'streak-tier-green', 'streak-tier-blue', 'streak-tier-gold', 'streak-tier-rainbow', 'streak-tier-lightning', 'streak-tier-hellfire', 'streak-tier-cosmic', 'streak-tier-cyber', 'streak-tier-blood-moon', 'streak-tier-master-prestige');
        if (streakClass) card.classList.add(streakClass);
    }
    const overlayTarget = frame.closest('.roster-portrait-wrap') || frame;
    const applyEffects = window.applyWinStreakEffects || window.applyWinStreakLightningOverlay;
    if (typeof applyEffects === 'function') applyEffects(overlayTarget, fighter);
    if (typeof window.applyLoseStreakPortraitEffects === 'function') {
        window.applyLoseStreakPortraitEffects(frame, fighter);
        if (card) {
            card.classList.remove('cold-streak-slump', 'cold-streak-freeze', 'cold-streak-hot-seat');
            const coldStreakClass = window.getLoseStreakPortraitClass?.(fighter);
            if (coldStreakClass) card.classList.add(coldStreakClass);
        }
    }
}

window.getStreakClass = getStreakClass;

function getDefenseMilestoneBadgeHtml(fighter, defenseCountsByFighter) {
    const fighterId = String(fighter?.id || '');
    const fighterName = String(fighter?.name || '').trim().toLowerCase();
    const bestReignDefenses = Math.max(
        0,
        Number(defenseCountsByFighter?.get(`id:${fighterId}`)) || 0,
        Number(defenseCountsByFighter?.get(`name:${fighterName}`)) || 0,
        Number(fighter?.best_reign_defenses) || 0,
        Number(fighter?.longest_reign_defenses) || 0
    );
    const lifetimeDefenses = Math.max(0, Number(fighter?.lifetime_defenses) || 0);
    const milestone = typeof window.getDefenseMilestone === 'function'
        ? window.getDefenseMilestone(Math.max(bestReignDefenses, lifetimeDefenses))
        : { tier: 0, label: '', className: '' };
    return milestone.tier > 0
        ? `<span class="defense-milestone-badge ${milestone.className}">${milestone.label}</span>`
        : '';
}

function getRosterFightersForCurrentFilters() {
    const searchQuery = getRosterSearchQuery();
    const compareSelection = getRosterCompareSelection().map(name => name.toLowerCase());
    if (activeRosterQuickFilter === 'p4p') {
        if (typeof window.getPoundForPoundRankings !== 'function') return [];
        return window.getPoundForPoundRankings()
            .map(entry => {
                const fighterId = String(entry.fighter?.id || '');
                const fighterName = String(entry.fighter?.name || '').trim().toLowerCase();
                return fighters.find(fighter => fighterId && String(fighter.id) === fighterId) ||
                    fighters.find(fighter => fighterName && String(fighter.name || '').trim().toLowerCase() === fighterName) ||
                    null;
            })
            .filter(Boolean)
            .filter(fighter => {
                const normalizedName = String(fighter.name || '').trim().toLowerCase();
                return (!searchQuery || normalizedName.includes(searchQuery))
                    && (compareSelection.length === 0 || compareSelection.includes(normalizedName));
            });
    }
    const showHallOfFame = activeRosterQuickFilter === 'hall_of_fame';
    return fighters.filter(fighter => {
        if (showHallOfFame && fighter.retired !== true) return false;
        const normalizedName = String(fighter.name || '').trim().toLowerCase();
        return (!searchQuery || normalizedName.includes(searchQuery))
            && (compareSelection.length === 0 || compareSelection.includes(normalizedName));
    });
}

function getGiantKillerBadgeHtml(fighter) {
    const giantKills = Math.max(0, Math.floor(Number(fighter?.giant_kills) || 0));
    if (giantKills < 1) return '';
    const count = giantKills > 1 ? ` (${giantKills}x)` : '';
    return `<span class="giant-killer-badge">⚔️ GIANT KILLER${count}</span>`;
}

function escapeRosterHtml(value) {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value ?? '').replace(/[&<>"']/g, character => entities[character]);
}

function createRosterFighterCard(fighter, divisionRankLookup, championships, defenseCountsByFighter) {
    const card = document.createElement('div');
    const wins = Number(fighter.wins) || 0;
    const losses = Number(fighter.losses) || 0;
    const totalFightsValue = fighter.total_fights ?? fighter.match_count ?? fighter.matches ?? fighter.totalMatches;
    const totalFights = Number.isFinite(Number(totalFightsValue))
        ? Math.max(0, Number(totalFightsValue))
        : wins + losses;
    const winRate = wins + losses === 0 ? 0 : Math.round((wins / (wins + losses)) * 100);
    const weightClassLabel = fighter.division || fighter.weightClass || 'Unassigned';
    const heldBelts = championships.filter(belt => belt.championId === fighter.id);
    const lifetimeDefenses = Number(fighter.lifetime_defenses) || 0;
    const defenseMilestoneBadgeHtml = getDefenseMilestoneBadgeHtml(fighter, defenseCountsByFighter);
    const totalTitleFights = Number(fighter.total_title_fights) || 0;
    const rankBadgeHtml = typeof window.getDivisionRankBadgeHtml === 'function'
        ? window.getDivisionRankBadgeHtml(fighter, divisionRankLookup)
        : '';
    const streakBadgeHtml = typeof window.getWinStreakBadgeHtml === 'function'
        ? window.getWinStreakBadgeHtml(fighter)
        : '';
    const fightingStyleBadgeHtml = typeof window.getFighterStyleBadge === 'function'
        ? window.getFighterStyleBadge(fighter)
        : '';
    const giantKillerBadgeHtml = getGiantKillerBadgeHtml(fighter);
    const careerBonuses = Math.max(0, Math.floor(Number(fighter.career_bonuses) || 0));
    const bonusBadgeHtml = careerBonuses > 0
        ? `<span class="roster-bonus-badge">🏅 ${careerBonuses}x BONUS</span>`
        : '';
    const bossTierBadgeHtml = fighter.is_boss === true
        ? '<span class="boss-tier-badge">☠️ BOSS TIER</span>'
        : '';
    const bossSlays = Math.max(0, Math.floor(Number(fighter.boss_slays) || 0));
    const bossSlayerBadgeHtml = bossSlays > 0
        ? `<span class="boss-slayer-badge">🗡️ BOSS SLAYER${bossSlays > 1 ? ` (${bossSlays}x)` : ''}</span>`
        : '';
    const activeStreak = getRosterWinStreak(fighter);
    const titleEligibility = getTitleEligibilityStatus(fighter);
    const titleEligible = titleEligibility.eligible;
    const titleEligibleBadgeHtml = `<span class="title-eligibility-badge title-eligibility-badge--${titleEligibility.status}">${titleEligibility.label}</span>`;
    const fastTrackedBadgeHtml = fighter.fast_tracked === true
        ? '<span class="fast-tracked-roster-badge">⚡ FAST-TRACKED</span>'
        : '';
    const coldStreak = typeof window.getCurrentLoseStreak === 'function'
        ? window.getCurrentLoseStreak(fighter)
        : Math.max(0, Math.floor(Number(fighter.lose_streak) || 0));
    const coldStreakBadgeHtml = typeof window.getLoseStreakBadgeHtml === 'function'
        ? window.getLoseStreakBadgeHtml(coldStreak)
        : '';
    const finishCount = (canonicalKey, legacyKey, fallback = 0) => {
        const canonical = Number(fighter[canonicalKey]) || 0;
        const legacy = Number(fighter[legacyKey]) || 0;
        return Math.max(0, canonical || legacy || fallback);
    };
    const koWins = finishCount('win_ko', 'ko_wins');
    const subWins = finishCount('win_submission', 'sub_wins');
    const pinWins = finishCount('win_pinfall', 'pin_wins', Math.max(0, wins - koWins - subWins));
    const effectivePhoto = (typeof fighter.image === 'string' && fighter.image) ||
        (typeof fighter.profile_pic === 'string' && fighter.profile_pic) ||
        (typeof fighter.photo === 'string' && fighter.photo) ||
        (fighter.photo_key && window._fighterPhotoCache?.[String(fighter.photo_key)]) ||
        '';
    const avatarContent = effectivePhoto
        ? `<img src="${effectivePhoto}" alt="${fighter.name}">`
        : `<span class="roster-portrait-fallback">${String(fighter.name || '?').charAt(0)}</span>`;
    const beltCount = heldBelts.length;
    const beltPopoverId = `roster-belt-popover-${escapeRosterHtml(fighter.id)}`;
    const beltStatHtml = beltCount
        ? `<button type="button" class="roster-stat-pill roster-stat-pill--belts roster-stat-pill--interactive" aria-label="View ${beltCount} active championship${beltCount === 1 ? '' : 's'}" aria-haspopup="dialog" aria-controls="${beltPopoverId}" aria-expanded="false">🏆 ${beltCount} ${beltCount === 1 ? 'BELT' : 'BELTS'}</button>`
        : '<span class="roster-stat-pill roster-stat-pill--belts" aria-label="0 current belts" title="Current belts held">🏆 0 BELTS</span>';
    const beltPopoverHtml = beltCount
        ? `<div class="roster-belt-popover" id="${beltPopoverId}" role="dialog" aria-labelledby="${beltPopoverId}-heading">
            <strong id="${beltPopoverId}-heading">👑 ACTIVE CHAMPIONSHIPS (${beltCount})</strong>
            <ul>${heldBelts.map(belt => `<li>${escapeRosterHtml(belt.name || '')}</li>`).join('')}</ul>
        </div>`
        : '';
    const gender = String(fighter.gender || '').toLowerCase();

    card.className = 'fighter-card roster-fighter-row';
    card.id = `fighter-card-${fighter.id}`;
    card.dataset.gender = gender;
    card.dataset.retired = fighter.retired === true ? 'true' : 'false';
    card.dataset.ranked = rankBadgeHtml.includes('is-champion') || rankBadgeHtml.includes('is-contender') ? 'true' : 'false';
    card.dataset.streaking = activeStreak > 0 ? 'true' : 'false';
    card.dataset.giantKiller = Math.floor(Number(fighter.giant_kills) || 0) > 0 ? 'true' : 'false';
    card.dataset.coldStreak = coldStreak >= 3 ? 'true' : 'false';
    card.dataset.titleEligible = titleEligible ? 'true' : 'false';
    card.dataset.fastTracked = fighter.fast_tracked === true ? 'true' : 'false';
    card.dataset.bossTier = fighter.is_boss === true ? 'true' : 'false';
    card.classList.toggle('boss-tier-row', fighter.is_boss === true);
    card.classList.toggle('has-current-title', heldBelts.length > 0);
    card.classList.toggle('retired-legend-card', fighter.retired === true);
    card.innerHTML = `
        <div class="roster-row__portrait-column">
            <div class="roster-portrait-wrap">
                <div class="roster-portrait-frame portrait-frame-base" onclick="uploadFighterPhoto('${fighter.id}')" onkeydown="if(event.key === 'Enter' || event.key === ' '){event.preventDefault();uploadFighterPhoto('${fighter.id}')}" role="button" tabindex="0" aria-label="Edit ${fighter.name}'s photo">
                    ${avatarContent}
                </div>
                ${rankBadgeHtml}
            </div>
            <span class="roster-fight-count">FIGHTS ${totalFights}</span>
        </div>
        <div class="roster-row__identity">
            <h3 class="fighter-name-target" data-fighter-id="${fighter.id}">${fighter.name}</h3>
            <div class="roster-fighter-subtitle">${gender === 'female' ? 'Women' : 'Men'} <span>•</span> ${weightClassLabel}</div>
            <div class="roster-row__badges">
                ${streakBadgeHtml}
                ${coldStreakBadgeHtml}
                ${fightingStyleBadgeHtml}
                ${defenseMilestoneBadgeHtml}
                ${bossTierBadgeHtml}
                ${bossSlayerBadgeHtml}
                ${giantKillerBadgeHtml}
                ${titleEligibleBadgeHtml}
                ${fastTrackedBadgeHtml}
                ${bonusBadgeHtml}
            </div>
        </div>
        <div class="roster-row__record${beltCount ? ' roster-row__record--has-belts' : ''}">
            <span class="roster-row__record-label">W - L</span>
            <strong>${wins}W <span>-</span> ${losses}L</strong>
            <div class="roster-row__meta">
                <span class="roster-stat-pill roster-stat-pill--win-rate" aria-label="${winRate}% win rate" title="Win rate">📈 ${winRate}%</span>
                <span class="roster-stat-pill roster-stat-pill--defenses" aria-label="${lifetimeDefenses} title defenses" title="Title defenses">🛡️ ${lifetimeDefenses} DEF</span>
                ${beltStatHtml}
                <span class="roster-stat-pill roster-stat-pill--title-fights" aria-label="${totalTitleFights} total title fights" title="Total title fights">⚔️ ${totalTitleFights} TITLE</span>
            </div>
            ${beltPopoverHtml}
        </div>
        <div class="roster-row__finish-stats" aria-label="Finish breakdown">
            <div class="roster-finish-stat roster-finish-stat--pin"><strong>${pinWins}</strong><span>PIN</span></div>
            <div class="roster-finish-stat roster-finish-stat--ko"><strong>${koWins}</strong><span>KO</span></div>
            <div class="roster-finish-stat roster-finish-stat--sub"><strong>${subWins}</strong><span>SUB</span></div>
        </div>
        <div class="roster-row__actions">
            <div class="roster-row__primary-actions">
                <button type="button" class="roster-action-btn roster-action-btn--photo" onclick="uploadFighterPhoto('${fighter.id}')">📷 Photo</button>
                <button type="button" class="roster-action-btn roster-action-btn--history" onclick='openFighterHistory(${JSON.stringify(fighter.name)})'>📜 History</button>
                <button type="button" class="roster-action-btn roster-action-btn--quiet roster-action-btn--stats" onclick='openFighterAnalytics(${JSON.stringify(fighter.name)})'>📊 Stats</button>
                <label class="roster-retire-control">
                    <input type="checkbox" ${fighter.retired ? 'checked' : ''} ${fighter.wins < 10 && !fighter.retired ? 'disabled' : ''} onchange="toggleFighterRetirement('${fighter.id}', this)">
                    <span>🏅 Retire</span>
                </label>
            </div>
            <div class="roster-row__secondary-actions">
                <button type="button" class="roster-action-btn roster-action-btn--quiet roster-action-btn--edit" onclick="editSuperstar('${fighter.id}')">✏️ Edit</button>
                <button type="button" class="roster-action-btn roster-action-btn--danger" onclick="fireSuperstar('${fighter.id}')">🗑️ Delete</button>
            </div>
        </div>`;
    const beltToggle = card.querySelector('.roster-stat-pill--interactive');
    const record = beltToggle?.closest('.roster-row__record');
    if (beltToggle && record) {
        beltToggle.addEventListener('click', event => {
            event.stopPropagation();
            const isOpen = record.classList.contains('roster-row__record--belt-list-open');
            record.classList.toggle('roster-row__record--belt-list-open', !isOpen);
            record.classList.toggle('roster-row__record--belt-list-dismissed', isOpen);
            if (!isOpen) record.classList.remove('roster-row__record--belt-list-dismissed');
            const expanded = !isOpen;
            beltToggle.setAttribute('aria-expanded', String(expanded));
        });
        beltToggle.addEventListener('mouseenter', () =>
            record.classList.remove('roster-row__record--belt-list-dismissed')
        );
        beltToggle.addEventListener('focus', () =>
            record.classList.remove('roster-row__record--belt-list-dismissed')
        );
        record.addEventListener('mouseleave', () => {
            if (!beltToggle.matches(':focus-visible')) {
                record.classList.remove('roster-row__record--belt-list-dismissed');
            }
        });
        record.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || !record.classList.contains('roster-row__record--belt-list-open')) return;
            record.classList.remove('roster-row__record--belt-list-open');
            record.classList.add('roster-row__record--belt-list-dismissed');
            beltToggle.setAttribute('aria-expanded', 'false');
            beltToggle.focus();
        });
    }
    applyRosterStreakPortraitClass(card.querySelector('.roster-portrait-frame'), fighter);
    return card;
}

function createHallOfFamePlaqueCard(fighter, divisionRankLookup, defenseCountsByFighter) {
    const card = document.createElement('div');
    const wins = Math.max(0, Number(fighter.wins) || 0);
    const losses = Math.max(0, Number(fighter.losses) || 0);
    const peakWinStreak = Math.max(
        0,
        Math.floor(Number(fighter.peak_win_streak) || 0),
        Math.floor(Number(fighter.win_streak) || 0)
    );
    const finishCount = (canonicalKey, legacyKey, fallback = 0) => {
        const canonical = Number(fighter[canonicalKey]) || 0;
        const legacy = Number(fighter[legacyKey]) || 0;
        return Math.max(0, canonical || legacy || fallback);
    };
    const pinWins = finishCount('win_pinfall', 'pin_wins', Math.max(0, wins - finishCount('win_ko', 'ko_wins') - finishCount('win_submission', 'sub_wins')));
    const koWins = finishCount('win_ko', 'ko_wins');
    const subWins = finishCount('win_submission', 'sub_wins');
    const giantKillerBadgeHtml = getGiantKillerBadgeHtml(fighter);
    const bossSlays = Math.max(0, Math.floor(Number(fighter.boss_slays) || 0));
    const bossSlayerBadgeHtml = bossSlays > 0
        ? `<span class="boss-slayer-badge">🗡️ BOSS SLAYER${bossSlays > 1 ? ` (${bossSlays}x)` : ''}</span>`
        : '';
    const bossTierBadgeHtml = fighter.is_boss === true
        ? '<span class="boss-tier-badge">☠️ BOSS TIER</span>'
        : '';
    const careerBonuses = Math.max(0, Math.floor(Number(fighter.career_bonuses) || 0));
    const bonusBadgeHtml = careerBonuses > 0
        ? `<span class="roster-bonus-badge">🏅 ${careerBonuses}x BONUS</span>`
        : '';
    const styleBadgeHtml = typeof window.getFighterStyleBadge === 'function'
        ? window.getFighterStyleBadge(fighter)
        : '';
    const defenseMilestoneBadgeHtml = getDefenseMilestoneBadgeHtml(fighter, defenseCountsByFighter);
    const rankBadgeHtml = typeof window.getDivisionRankBadgeHtml === 'function'
        ? window.getDivisionRankBadgeHtml(fighter, divisionRankLookup)
        : '';
    const activeStreak = getRosterWinStreak(fighter);
    const coldStreak = typeof window.getCurrentLoseStreak === 'function'
        ? window.getCurrentLoseStreak(fighter)
        : Math.max(0, Math.floor(Number(fighter.lose_streak) || 0));
    const effectivePhoto = (typeof fighter.image === 'string' && fighter.image) ||
        (typeof fighter.profile_pic === 'string' && fighter.profile_pic) ||
        (typeof fighter.photo === 'string' && fighter.photo) ||
        (fighter.photo_key && window._fighterPhotoCache?.[String(fighter.photo_key)]) ||
        '';
    const avatarContent = effectivePhoto
        ? `<img src="${effectivePhoto}" alt="${fighter.name}">`
        : `<span class="roster-portrait-fallback">${String(fighter.name || '?').charAt(0)}</span>`;
    const division = fighter.division || fighter.weightClass || 'Unassigned';

    card.className = 'fighter-card roster-fighter-row hall-of-fame-plaque retired-legend-card';
    card.id = `fighter-card-${fighter.id}`;
    card.dataset.retired = 'true';
    card.dataset.gender = String(fighter.gender || '').toLowerCase();
    card.dataset.ranked = rankBadgeHtml.includes('is-champion') || rankBadgeHtml.includes('is-contender') ? 'true' : 'false';
    card.dataset.streaking = activeStreak > 0 ? 'true' : 'false';
    card.dataset.giantKiller = Math.floor(Number(fighter.giant_kills) || 0) > 0 ? 'true' : 'false';
    card.dataset.coldStreak = coldStreak >= 3 ? 'true' : 'false';
    card.dataset.bossTier = fighter.is_boss === true ? 'true' : 'false';
    card.innerHTML = `
        <div class="hof-plaque__portrait-column">
            <div class="roster-portrait-wrap">
                <div class="roster-portrait-frame portrait-frame-base hof-plaque__portrait-frame" onclick="uploadFighterPhoto('${fighter.id}')" role="button" tabindex="0" aria-label="Edit ${fighter.name}'s photo">
                    ${avatarContent}
                </div>
                <span class="hof-plaque__ribbon">🏛️ HOF INDUCTEE</span>
            </div>
        </div>
        <div class="hof-plaque__legacy">
            <h3 class="fighter-name-target" data-fighter-id="${fighter.id}">${fighter.name}</h3>
            <div class="roster-fighter-subtitle">${division}</div>
            <div class="hof-plaque__summary">
                <strong>CAREER ${wins}W - ${losses}L</strong>
                <span>🔥 Peak Streak: ${peakWinStreak}W</span>
                <span>🏆 Title Defenses: ${Math.max(0, Number(fighter.lifetime_defenses) || 0)}</span>
            </div>
            <div class="roster-row__badges">
                ${styleBadgeHtml}
                ${defenseMilestoneBadgeHtml}
                ${giantKillerBadgeHtml}
                ${bossSlayerBadgeHtml}
                ${bossTierBadgeHtml}
                ${bonusBadgeHtml}
            </div>
        </div>
        <div class="roster-row__finish-stats hof-plaque__finish-stats" aria-label="Career finish breakdown">
            <div class="roster-finish-stat roster-finish-stat--pin"><strong>${pinWins}</strong><span>PIN</span></div>
            <div class="roster-finish-stat roster-finish-stat--ko"><strong>${koWins}</strong><span>KO</span></div>
            <div class="roster-finish-stat roster-finish-stat--sub"><strong>${subWins}</strong><span>SUB</span></div>
        </div>
        <div class="hof-plaque__actions">
            <button type="button" class="roster-action-btn" onclick='openFighterHistory(${JSON.stringify(fighter.name)})'>History</button>
            <button type="button" class="hof-comeback-button" onclick="unretireFighter('${fighter.id}')">Unretire / Comeback</button>
        </div>`;
    return card;
}

function updateRosterHeaderCounts() {
    const activeCount = fighters.filter(fighter => fighter.retired !== true).length;
    const inducteeCount = fighters.filter(fighter => fighter.retired === true).length;
    const rosterCount = document.getElementById('rosterCount');
    const hallOfFameCount = document.getElementById('hallOfFameCount');
    if (rosterCount) rosterCount.textContent = `${activeCount} Superstars`;
    if (hallOfFameCount) hallOfFameCount.textContent = `🏛️ ${inducteeCount} Inductees`;
}

function renderRosterGrid() {
    const grid = document.getElementById('rosterGrid');
    if (!grid) return;

    // Use the already-loaded fighter list so hydrated photo data is preserved.
    refreshFighterNameDatalist();
    const championships = JSON.parse(localStorage.getItem('wwe_titles')) || [];
    const defenseCountsByFighter = typeof window.getTitleReignDefenseCountsByFighter === 'function'
        ? window.getTitleReignDefenseCountsByFighter(championships, fighters)
        : new Map();
    const divisionRankings = typeof window.getDivisionRankings === 'function'
        ? window.getDivisionRankings()
        : [];
    const divisionRankLookup = typeof window.getDivisionRankLookup === 'function'
        ? window.getDivisionRankLookup(divisionRankings)
        : null;

    buildMasterRankingsPanel();
    buildRosterComparePanel();

    grid.innerHTML = '';
    updateRosterHeaderCounts();

    if (fighters.length === 0) {
        grid.innerHTML = '<div class="roster-empty-state">Your locker room is empty. Use the roster form to add your very first wrestler!</div>';
        return;
    }

    const rosterToRender = getRosterFightersForCurrentFilters();
    if (rosterToRender.length === 0) {
        grid.innerHTML = activeRosterQuickFilter === 'hall_of_fame'
            ? '<div class="roster-empty-state">No Hall of Fame inductees yet. Retire a fighter with at least 10 wins to enshrine a legend.</div>'
            : '<div class="roster-empty-state">No fighters match the current filters.</div>';
        return;
    }

    rosterToRender.forEach(f => {
        const card = f.retired === true
            ? createHallOfFamePlaqueCard(f, divisionRankLookup, defenseCountsByFighter)
            : createRosterFighterCard(f, divisionRankLookup, championships, defenseCountsByFighter);
        grid.appendChild(card);
    });

    // Re-apply any saved roster comparison filter after cards are recreated
    applySavedCompareFilter();

    // If a fighter was selected from another page (lineage), scroll and highlight
    const sel = localStorage.getItem('wwe_selected_fighter');
    if (sel) {
        const el = document.getElementById(`fighter-card-${sel}`);
        if (el) {
            setTimeout(() => {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const prevBox = el.style.boxShadow;
                el.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.12)';
                el.style.transition = 'box-shadow 0.3s ease';
                setTimeout(() => { el.style.boxShadow = prevBox || ''; }, 3500);
            }, 200);
        }
        localStorage.removeItem('wwe_selected_fighter');
    }

}

window.toggleFighterRetirement = function(id, checkbox) {
    const fighter = fighters.find(item => item.id === id);
    if (!fighter) return;
    if (Number(fighter.wins || 0) < 10) {
        checkbox.checked = false;
        checkbox.disabled = true;
        alert('Fighter must have at least 10 wins to retire.');
        return;
    }
    fighter.retired = checkbox.checked;
    saveFighters(fighters);
    activeRosterQuickFilter = fighter.retired ? 'hall_of_fame' : 'all';
    renderRosterGrid();
};

window.unretireFighter = function(id) {
    const fighter = fighters.find(item => String(item.id) === String(id));
    if (!fighter) return;
    fighter.retired = false;
    saveFighters(fighters);
    activeRosterQuickFilter = 'all';
    renderRosterGrid();
};

// Debounced scheduler to avoid rapid consecutive renders which cause visual glitches
window._renderRosterTimer = window._renderRosterTimer || null;
window.scheduleRenderRosterGrid = function(delay = 50) {
    if (window._renderRosterTimer) clearTimeout(window._renderRosterTimer);
    window._renderRosterTimer = setTimeout(() => {
                try { if (typeof renderRosterGrid === 'function') renderRosterGrid(); } catch (e) { /* ignore */ }
        window._renderRosterTimer = null;
    }, delay);
};

// Backwards-compatible alias used by other modules (e.g., app.js)
window.renderRoster = function() {
    if (typeof scheduleRenderRosterGrid === 'function') return scheduleRenderRosterGrid();
    try { if (typeof renderRosterGrid === 'function') return renderRosterGrid(); } catch (e) {}
};

    // Harvest any existing in-DOM data-URL portraits synchronously into memory/cache so
    // they survive the imminent DOM replace. IDB writes are queued in the background.
    try {
        const imgs = Array.from(document.querySelectorAll('#rosterGrid [id^="fighter-card-"] img'));
        const pending = [];
        if (imgs.length) {
            for (const img of imgs) {
                try {
                    const card = img.closest('[id^="fighter-card-"]');
                    if (!card) continue;
                    const idMatch = String(card.id || '').replace('fighter-card-', '');
                    if (!idMatch) continue;
                    const fighter = fighters.find(ff => String(ff.id) === String(idMatch));
                    const src = img.src || '';
                    if (!fighter || !src || !src.startsWith('data:image')) continue;
                    if ((fighter.photo && fighter.photo.startsWith && fighter.photo.startsWith('data:image')) || fighter.photo_key) continue;
                    const key = fighter.photo_key || `fighter-photo-${fighter.id}`;
                    // immediately keep photo in-memory and prime session cache so render uses it
                    fighter.photo_key = fighter.photo_key || key;
                    fighter.photo = src;
                    window._fighterPhotoCache = window._fighterPhotoCache || Object.create(null);
                    window._fighterPhotoCache[String(key)] = src;
                    // queue IDB persist in background (do not await here)
                    if (typeof storeFighterPhotoInIDB === 'function') pending.push(storeFighterPhotoInIDB(key, src).catch(() => {}));
                } catch (e) {
                    // non-fatal
                }
            }
            // persist fighters and let background IDB writes proceed
            try { saveFighters(fighters); } catch (e) { /* ignore */ }
            if (pending.length) Promise.allSettled(pending).then(() => { try { saveFighters(fighters); } catch (e) {} });
        }
    } catch (e) { /* ignore */ }
function renderRosterGridWithoutReload() {
    const grid = document.getElementById('rosterGrid');
    if (!grid) return;

    ensureMissingPortraits(fighters);

    
        // Preserve any existing data-URL avatars that are currently in the DOM (sync into memory/cache)
        try {
            const imgs = Array.from(document.querySelectorAll('#rosterGrid [id^="fighter-card-"] img'));
            const pending = [];
            if (imgs.length) {
                for (const img of imgs) {
                    try {
                        const card = img.closest('[id^="fighter-card-"]');
                        if (!card) continue;
                        const idMatch = String(card.id || '').replace('fighter-card-', '');
                        if (!idMatch) continue;
                        const fighter = fighters.find(ff => String(ff.id) === String(idMatch));
                        const src = img.src || '';
                        if (!fighter || !src || !src.startsWith('data:image')) continue;
                        if ((fighter.photo && fighter.photo.startsWith && fighter.photo.startsWith('data:image')) || fighter.photo_key) continue;
                        const key = fighter.photo_key || `fighter-photo-${fighter.id}`;
                        fighter.photo_key = fighter.photo_key || key;
                        fighter.photo = src;
                        window._fighterPhotoCache = window._fighterPhotoCache || Object.create(null);
                        window._fighterPhotoCache[String(key)] = src;
                        if (typeof storeFighterPhotoInIDB === 'function') pending.push(storeFighterPhotoInIDB(key, src).catch(() => {}));
                    } catch (e) { /* non-fatal */ }
                }
                try { saveFighters(fighters); } catch (e) { /* ignore */ }
                if (pending.length) Promise.allSettled(pending).then(() => { try { saveFighters(fighters); } catch (e) {} });
            }
        } catch (e) { /* ignore */ }

    const championships = JSON.parse(localStorage.getItem('wwe_titles')) || [];
    const defenseCountsByFighter = typeof window.getTitleReignDefenseCountsByFighter === 'function'
        ? window.getTitleReignDefenseCountsByFighter(championships, fighters)
        : new Map();
        const divisionRankings = typeof window.getDivisionRankings === 'function'
            ? window.getDivisionRankings()
            : [];
        const divisionRankLookup = typeof window.getDivisionRankLookup === 'function'
            ? window.getDivisionRankLookup(divisionRankings)
            : null;

    buildMasterRankingsPanel();
    buildRosterComparePanel();

    grid.innerHTML = '';
    updateRosterHeaderCounts();

    if (fighters.length === 0) {
        grid.innerHTML = '<div class="roster-empty-state">Your locker room is empty. Use the roster form to add your very first wrestler!</div>';
        return;
    }

    const rosterToRender = getRosterFightersForCurrentFilters();
    rosterToRender.forEach(fighter => {
        grid.appendChild(fighter.retired === true
            ? createHallOfFamePlaqueCard(fighter, divisionRankLookup, defenseCountsByFighter)
            : createRosterFighterCard(fighter, divisionRankLookup, championships, defenseCountsByFighter));
    });
    if (rosterToRender.length === 0) {
        grid.innerHTML = activeRosterQuickFilter === 'hall_of_fame'
            ? '<div class="roster-empty-state">No Hall of Fame inductees yet. Retire a fighter with at least 10 wins to enshrine a legend.</div>'
            : '<div class="roster-empty-state">No fighters match the current filters.</div>';
    }

    // Re-apply any saved roster comparison filter after cards are recreated
    applySavedCompareFilter();

    // If a fighter was selected from another page (lineage), scroll and highlight
    const sel = localStorage.getItem('wwe_selected_fighter');
    if (sel) {
        const el = document.getElementById(`fighter-card-${sel}`);
        if (el) {
            setTimeout(() => {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const prevBox = el.style.boxShadow;
                el.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.12)';
                el.style.transition = 'box-shadow 0.3s ease';
                setTimeout(() => { el.style.boxShadow = prevBox || ''; }, 3500);
            }, 200);
        }
        localStorage.removeItem('wwe_selected_fighter');
    }

    // Re-apply any saved search filter after rendering the grid
    const savedSearch = localStorage.getItem('wwe_roster_search_query');
    if (savedSearch) {
        setTimeout(() => {
            const hasCompare = (localStorage.getItem('wwe_roster_compare_fighter_a') || '') || (localStorage.getItem('wwe_roster_compare_fighter_b') || '');
            if (!hasCompare) filterRosterCards();
            else applySavedCompareFilter();
        }, 50);
    }
}

function buildMasterRankingsPanel() {
    const existingPanel = document.getElementById('rosterLeaderboardFilters');
    if (existingPanel) existingPanel.remove();

    const gridElement = document.getElementById('rosterGrid');
    if (!gridElement || !gridElement.parentNode) return;

    const championships = JSON.parse(localStorage.getItem('wwe_titles')) || [];
    const fightersCopy = [...fighters];

    const mostTitleFights = fightersCopy.reduce((best, fighter) => {
        const count = fighter.total_title_fights || 0;
        return count > (best.count || 0) ? { fighter, count } : best;
    }, { fighter: null, count: 0 });

    const mostDefenses = fightersCopy.reduce((best, fighter) => {
        const championships = JSON.parse(localStorage.getItem('wwe_titles')) || [];
        const count = championships.filter(b => b.championId === fighter.id).reduce((s, bb) => s + (bb.defenses || 0), 0);
        return count > (best.count || 0) ? { fighter, count } : best;
    }, { fighter: null, count: 0 });

    const mostBelts = fightersCopy.reduce((best, fighter) => {
        const beltCount = championships.filter(b => b.championId === fighter.id).length;
        return beltCount > (best.count || 0) ? { fighter, count: beltCount } : best;
    }, { fighter: null, count: 0 });

    const filterPanel = document.createElement('div');
    filterPanel.id = 'rosterLeaderboardFilters';
    filterPanel.style.cssText = "background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin: 0 0 24px 0; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-family: sans-serif; width: 100%; box-sizing: border-box;";

    filterPanel.innerHTML = `
        <span style="font-size: 0.75rem; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em;">📊 Roster Rankings:</span>
        <button type="button" data-metric="p4p" aria-pressed="${activeRosterQuickFilter === 'p4p'}" style="background: linear-gradient(135deg, #451a03, #b45309); border: 1px solid #f59e0b; padding: 7px 15px; border-radius: 999px; font-size: 0.72rem; font-weight: 950; color: #fffbeb; cursor: pointer;">👑 P4P Top 15</button>
        <button type="button" data-metric="alphabetical" style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #475569; cursor: pointer;">🔤 A-Z</button>
        <button type="button" data-metric="wins" style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #16a34a; cursor: pointer;">👑 Most Wins</button>
        <button type="button" data-metric="losses" style="background: #fff5f5; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #dc2626; cursor: pointer;">📉 Most Losses</button>
        <button type="button" data-metric="fights" style="background: #fef3c7; border: 1px solid #fde68a; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #b45309; cursor: pointer;">🥊 Most Fights</button>
        <button type="button" data-metric="win_pinfall" style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #0284c7; cursor: pointer;">📌 Pinfall Leaders</button>
        <button type="button" data-metric="win_ko" style="background: #fff7ed; border: 1px solid #ffedd5; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #ea580c; cursor: pointer;">💥 KO Masters</button>
        <button type="button" data-metric="win_submission" style="background: #fbf7ff; border: 1px solid #f3e8ff; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #7c3aed; cursor: pointer;">🥋 Submission Experts</button>
        <button type="button" data-metric="win_rate" style="background: #ecfeff; border: 1px solid #cffafe; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #0284c7; cursor: pointer;">📈 Win Rate</button>
        <button type="button" data-metric="total_title_fights" style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 999px; font-size: 0.7rem; font-weight: bold; color: #0f172a; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">🏆 Most Title Fights</button>
        <button type="button" data-metric="career_bonuses" style="background: linear-gradient(135deg, #78350f, #b45309); border: 1px solid #f59e0b; padding: 6px 14px; border-radius: 999px; font-size: 0.7rem; font-weight: 900; color: #fff7ed; cursor: pointer;">🏅 Most Bonuses</button>
        <button type="button" data-metric="giant_kills" aria-pressed="${activeRosterQuickFilter === 'giant_killers'}" style="background: linear-gradient(135deg, #450a0a, #b45309); border: 1px solid #f59e0b; padding: 6px 14px; border-radius: 999px; font-size: 0.7rem; font-weight: 900; color: #fff7ed; cursor: pointer;">⚔️ Giant Killers</button>
        <button type="button" data-metric="cold_streaks" aria-pressed="${activeRosterQuickFilter === 'cold_streaks'}" style="background: linear-gradient(135deg, #0c4a6e, #0369a1); border: 1px solid #7dd3fc; padding: 6px 14px; border-radius: 999px; font-size: 0.7rem; font-weight: 900; color: #e0f2fe; cursor: pointer;">❄️ Cold Streaks</button>
        <button type="button" data-metric="boss_tier" aria-pressed="${activeRosterQuickFilter === 'boss_tier'}" style="background: linear-gradient(135deg, #450a0a, #7f1d1d); border: 1px solid #b91c1c; padding: 6px 14px; border-radius: 999px; font-size: 0.7rem; font-weight: 900; color: #fef3c7; cursor: pointer;">☠️ Boss Tier</button>
        <button type="button" data-metric="hall_of_fame" aria-pressed="${activeRosterQuickFilter === 'hall_of_fame'}" style="background: linear-gradient(135deg, #451a03, #d97706); border: 1px solid #fbbf24; padding: 7px 15px; border-radius: 999px; font-size: 0.72rem; font-weight: 950; color: #fffbeb; cursor: pointer; box-shadow: 0 0 12px rgba(217, 119, 6, 0.2);">🏛️ Hall of Fame</button>
        <button type="button" data-metric="defenses" style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 999px; font-size: 0.7rem; font-weight: bold; color: #0f172a; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">🛡️ Most Title Defenses</button>
        <button type="button" data-metric="current_belts" style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 999px; font-size: 0.7rem; font-weight: bold; color: #0f172a; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">🎖️ Most Current Belts</button>
        <button type="button" data-metric="gender_male" style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #0284c7; cursor: pointer;">Men</button>
        <button type="button" data-metric="gender_female" style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #0284c7; cursor: pointer;">Women</button>
        <button type="button" data-metric="division_cruiser" style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #0284c7; cursor: pointer;">Cruiserweight</button>
        <button type="button" data-metric="division_light_heavy" style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #0284c7; cursor: pointer;">Light Heavyweight</button>
        <button type="button" data-metric="division_heavy" style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #0284c7; cursor: pointer;">Heavyweight</button>
        <button type="button" data-metric="division_super_heavy" style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #0284c7; cursor: pointer;">Super Heavyweight</button>
    `;

    // Make clicks responsive: use event delegation and pointerdown for immediacy
    filterPanel.addEventListener('pointerdown', function(ev) {
        const btn = ev.target.closest && ev.target.closest('button[data-metric]');
        if (!btn) return;
        ev.preventDefault();
        const metric = btn.getAttribute('data-metric');
        if (metric === 'p4p') {
            setRosterQuickFilter('p4p');
            return;
        }
        if (metric === 'giant_kills') {
            setRosterQuickFilter('giant_killers');
            return;
        }
        if (metric === 'cold_streaks') {
            setRosterQuickFilter('cold_streaks');
            return;
        }
        if (metric === 'boss_tier') {
            setRosterQuickFilter('boss_tier');
            return;
        }
        if (metric === 'hall_of_fame') {
            setRosterQuickFilter('hall_of_fame');
            return;
        }
        try { sortRosterByMetric(metric); } catch (e) { console.error('sortRosterByMetric failed', e); }
    });

    gridElement.parentNode.insertBefore(filterPanel, gridElement);
}

function buildRosterComparePanel() {
    const existing = document.getElementById('rosterComparePanel');
    if (existing) existing.remove();

    const gridElement = document.getElementById('rosterGrid');
    const panelHost = document.getElementById('rosterComparePanelHost');
    if (!panelHost && (!gridElement || !gridElement.parentNode)) return;

    // Restore saved compare values from localStorage
    const savedFighterA = localStorage.getItem('wwe_roster_compare_fighter_a') || '';
    const savedFighterB = localStorage.getItem('wwe_roster_compare_fighter_b') || '';

    const comparePanel = document.createElement('div');
    comparePanel.id = 'rosterComparePanel';
    comparePanel.className = 'roster-compare-controls';
    comparePanel.innerHTML = `
        <div class="roster-compare-fields">
            <div class="roster-compare-label">Head-to-Head Compare</div>
            <div class="roster-compare-inputs">
                <input id="compareFighterA" list="compareNamesA" oninput="updateRosterCompareDatalists(); tryAutoCompare()" aria-label="First fighter to compare" placeholder="Fighter A" value="${savedFighterA}">
                <span class="roster-compare-vs">VS</span>
                <input id="compareFighterB" list="compareNamesB" oninput="updateRosterCompareDatalists(); tryAutoCompare()" aria-label="Second fighter to compare" placeholder="Fighter B" value="${savedFighterB}">
                <button type="button" class="roster-compare-button" onclick="compareRosterFighters()">Compare</button>
                <button type="button" class="roster-compare-clear" onclick="clearRosterCompare()">Clear</button>
            </div>
        </div>
        <div class="roster-quick-filters" role="group" aria-label="Quick roster filters">
            <button type="button" class="roster-filter-pill" data-roster-filter="all" aria-pressed="${activeRosterQuickFilter === 'all'}">All</button>
            <button type="button" class="roster-filter-pill" data-roster-filter="male" aria-pressed="${activeRosterQuickFilter === 'male'}">Men</button>
            <button type="button" class="roster-filter-pill" data-roster-filter="female" aria-pressed="${activeRosterQuickFilter === 'female'}">Women</button>
            <button type="button" class="roster-filter-pill" data-roster-filter="ranked" aria-pressed="${activeRosterQuickFilter === 'ranked'}">Ranked Top 15</button>
            <button type="button" class="roster-filter-pill" data-roster-filter="streaks" aria-pressed="${activeRosterQuickFilter === 'streaks'}">Streaks</button>
            <button type="button" class="roster-filter-pill" data-roster-filter="giant_killers" aria-pressed="${activeRosterQuickFilter === 'giant_killers'}">⚔️ Giant Killers</button>
            <button type="button" class="roster-filter-pill" data-roster-filter="cold_streaks" aria-pressed="${activeRosterQuickFilter === 'cold_streaks'}">❄️ Cold Streaks</button>
            <button type="button" class="roster-filter-pill" data-roster-filter="boss_tier" aria-pressed="${activeRosterQuickFilter === 'boss_tier'}">☠️ Boss Tier</button>
        </div>
    `;

    if (panelHost) panelHost.appendChild(comparePanel);
    else gridElement.parentNode.insertBefore(comparePanel, gridElement);
    comparePanel.addEventListener('click', event => {
        const filterButton = event.target.closest('[data-roster-filter]');
        if (!filterButton) return;
        setRosterQuickFilter(filterButton.dataset.rosterFilter || 'all');
    });
    updateRosterCompareDatalists();

    // If there were saved fighters and the roster is available, apply the comparison quietly.
    // Avoid calling `compareRosterFighters()` here because it can show alerts when the
    // roster isn't fully loaded (causing the modal you saw). Defer to `applySavedCompareFilter`
    // which silently applies the filter when both fighters exist. If the roster isn't ready,
    // Comparison values are restored directly while the panel is built.
    if (savedFighterA && savedFighterB && Array.isArray(fighters) && fighters.length > 0) {
        applySavedCompareFilter();
    }
    // Attach persistent listeners so values are saved and datalist selections auto-apply
    try {
        const aEl = document.getElementById('compareFighterA');
        const bEl = document.getElementById('compareFighterB');
        if (aEl) {
            aEl.addEventListener('input', () => {
                try { const v = aEl.value.trim(); if (v) localStorage.setItem('wwe_roster_compare_fighter_a', v); } catch (e) {}
            });
            aEl.addEventListener('change', () => {
                tryAutoCompare();
            });
        }
        if (bEl) {
            bEl.addEventListener('input', () => {
                try { const v = bEl.value.trim(); if (v) localStorage.setItem('wwe_roster_compare_fighter_b', v); } catch (e) {}
            });
            bEl.addEventListener('change', () => {
                tryAutoCompare();
            });
        }
    } catch (e) {}
}

function updateRosterCompareDatalists() {
    const elA = document.getElementById('compareFighterA');
    const elB = document.getElementById('compareFighterB');
    const selectedA = elA && elA.value ? elA.value.trim().toLowerCase() : '';
    const selectedB = elB && elB.value ? elB.value.trim().toLowerCase() : '';

    // Save compare inputs to localStorage only when inputs have a non-empty value
    try {
        if (elA && selectedA) localStorage.setItem('wwe_roster_compare_fighter_a', elA.value.trim());
        if (elB && selectedB) localStorage.setItem('wwe_roster_compare_fighter_b', elB.value.trim());
    } catch (e) {}
    
    let listA = document.getElementById('compareNamesA');
    let listB = document.getElementById('compareNamesB');
    if (!listA) {
        listA = document.createElement('datalist');
        listA.id = 'compareNamesA';
        document.body.appendChild(listA);
    }
    if (!listB) {
        listB = document.createElement('datalist');
        listB.id = 'compareNamesB';
        document.body.appendChild(listB);
    }
    listA.innerHTML = '';
    listB.innerHTML = '';

    const names = fighters.map(f => f.name).filter(Boolean).sort((a, b) => a.localeCompare(b));
    names.forEach(name => {
        const lower = name.toLowerCase();
        if (selectedB && lower === selectedB) return;
        const optionA = document.createElement('option');
        optionA.value = name;
        listA.appendChild(optionA);
        if (selectedA && lower === selectedA) return;
        const optionB = document.createElement('option');
        optionB.value = name;
        listB.appendChild(optionB);
    });
}

function getRosterSearchQuery() {
    const input = document.getElementById('rosterSearchInput');
    return input ? input.value.trim().toLowerCase() : (localStorage.getItem('wwe_roster_search_query') || '').toLowerCase();
}

function getRosterCompareSelection() {
    if (activeRosterQuickFilter === 'hall_of_fame') return [];
    const a = localStorage.getItem('wwe_roster_compare_fighter_a') || '';
    const b = localStorage.getItem('wwe_roster_compare_fighter_b') || '';
    const selection = [a, b].map(value => String(value).trim()).filter(Boolean);
    return selection;
}

function matchesRosterQuickFilter(card) {
    if (activeRosterQuickFilter === 'hall_of_fame') return card.dataset.retired === 'true';
    if (activeRosterQuickFilter === 'male' || activeRosterQuickFilter === 'female') {
        return card.dataset.gender === activeRosterQuickFilter;
    }
    if (activeRosterQuickFilter === 'ranked') return card.dataset.ranked === 'true';
    if (activeRosterQuickFilter === 'streaks') return card.dataset.streaking === 'true';
    if (activeRosterQuickFilter === 'giant_killers') return card.dataset.giantKiller === 'true';
    if (activeRosterQuickFilter === 'cold_streaks') return card.dataset.coldStreak === 'true';
    if (activeRosterQuickFilter === 'boss_tier') return card.dataset.bossTier === 'true';
    return true;
}

function setRosterQuickFilter(filter) {
    const changesRosterView =
        (activeRosterQuickFilter === 'hall_of_fame') !== (filter === 'hall_of_fame') ||
        activeRosterQuickFilter === 'p4p' ||
        filter === 'p4p';
    activeRosterQuickFilter = filter;
    document.querySelectorAll('[data-roster-filter]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.rosterFilter === filter));
    });
    document.querySelector('#rosterLeaderboardFilters [data-metric="giant_kills"]')
        ?.setAttribute('aria-pressed', String(filter === 'giant_killers'));
    document.querySelector('#rosterLeaderboardFilters [data-metric="cold_streaks"]')
        ?.setAttribute('aria-pressed', String(filter === 'cold_streaks'));
    document.querySelector('#rosterLeaderboardFilters [data-metric="boss_tier"]')
        ?.setAttribute('aria-pressed', String(filter === 'boss_tier'));
    document.querySelector('#rosterLeaderboardFilters [data-metric="hall_of_fame"]')
        ?.setAttribute('aria-pressed', String(filter === 'hall_of_fame'));
    document.querySelector('#rosterLeaderboardFilters [data-metric="p4p"]')
        ?.setAttribute('aria-pressed', String(filter === 'p4p'));
    if (changesRosterView) {
        renderRosterGrid();
    } else {
        window.filterRosterCards();
    }
}

function updateRosterQuickFilterEmptyState(visibleCount) {
    const grid = document.getElementById('rosterGrid');
    if (!grid) return;
    const existing = grid.querySelector('.roster-filter-empty');
    if (!grid.querySelector('.roster-fighter-row')) {
        existing?.remove();
        return;
    }
    if (visibleCount === 0 && !existing) {
        const emptyState = document.createElement('div');
        emptyState.className = 'roster-empty-state roster-filter-empty';
        emptyState.textContent = 'No fighters match this quick filter.';
        grid.appendChild(emptyState);
    } else if (visibleCount > 0) {
        existing?.remove();
    }
}

function applyCombinedRosterFilters() {
    const searchQuery = getRosterSearchQuery();
    const compareSelection = getRosterCompareSelection();
    let visibleCount = 0;

    document.querySelectorAll('#rosterGrid > div').forEach(card => {
        const nameEl = card.querySelector('.fighter-name-target');
        if (!nameEl) return;

        const nameText = nameEl.textContent.trim();
        const normalizedName = nameText.toLowerCase();
        const matchesSearch = !searchQuery || normalizedName.includes(searchQuery);

        let matchesCompare = true;
        if (compareSelection.length === 2) {
            matchesCompare = compareSelection.some(value => normalizedName === value.toLowerCase());
        } else if (compareSelection.length === 1) {
            matchesCompare = normalizedName === compareSelection[0].toLowerCase();
        }

        const isVisible = matchesSearch && matchesCompare && matchesRosterQuickFilter(card);
        card.style.display = isVisible ? 'flex' : 'none';
        if (isVisible) visibleCount++;
    });
    updateRosterQuickFilterEmptyState(visibleCount);
}

function filterRosterByComparison(selectedNames = []) {
    const selected = selectedNames.map(value => String(value).trim()).filter(Boolean).map(value => value.toLowerCase());
    const cards = document.querySelectorAll('#rosterGrid > div');
    const searchQuery = getRosterSearchQuery();
    let visibleCount = 0;

    cards.forEach(card => {
        const nameEl = card.querySelector('.fighter-name-target');
        if (!nameEl) return;
        const nameText = nameEl.textContent.trim();
        const normalizedName = nameText.toLowerCase();
        const matchesSearch = !searchQuery || normalizedName.includes(searchQuery);
        const matchesCompare = selected.length === 0 || selected.includes(normalizedName);
        const isVisible = matchesSearch && matchesCompare && matchesRosterQuickFilter(card);
        card.style.display = isVisible ? 'flex' : 'none';
        if (isVisible) visibleCount++;
    });
    updateRosterQuickFilterEmptyState(visibleCount);
}

function compareRosterFighters() {
    const nameA = document.getElementById('compareFighterA')?.value.trim();
    const nameB = document.getElementById('compareFighterB')?.value.trim();
    if (!nameA || !nameB) {
        alert('Enter both fighters to compare.');
        return;
    }
    if (nameA.toLowerCase() === nameB.toLowerCase()) {
        alert('Please choose two different fighters.');
        return;
    }

    const fighterA = fighters.find(f => f.name.toLowerCase() === nameA.toLowerCase());
    const fighterB = fighters.find(f => f.name.toLowerCase() === nameB.toLowerCase());
    if (!fighterA || !fighterB) {
        alert('One or both fighters were not found in your roster.');
        return;
    }

    // Save the comparison state to localStorage
    localStorage.setItem('wwe_roster_compare_fighter_a', nameA);
    localStorage.setItem('wwe_roster_compare_fighter_b', nameB);

    renderRosterGrid();
}

// Try to auto-apply a comparison while the user types (no alerts)
function tryAutoCompare() {
    const inputA = document.getElementById('compareFighterA');
    const inputB = document.getElementById('compareFighterB');
    if (!inputA || !inputB) return;
    const nameA = inputA.value.trim();
    const nameB = inputB.value.trim();
    if (!nameA || !nameB) return;
    if (nameA.toLowerCase() === nameB.toLowerCase()) return;
    const fighterA = fighters.find(f => f.name.toLowerCase() === nameA.toLowerCase());
    const fighterB = fighters.find(f => f.name.toLowerCase() === nameB.toLowerCase());
    if (fighterA && fighterB) {
        // Save exact input values and apply the filter without user alerts
        localStorage.setItem('wwe_roster_compare_fighter_a', fighterA.name);
        localStorage.setItem('wwe_roster_compare_fighter_b', fighterB.name);
        scheduleRenderRosterGrid(100);
    }
}

function applySavedCompareFilter() {
    if (activeRosterQuickFilter === 'hall_of_fame') {
        applyCombinedRosterFilters();
        return;
    }
    const savedA = localStorage.getItem('wwe_roster_compare_fighter_a') || '';
    const savedB = localStorage.getItem('wwe_roster_compare_fighter_b') || '';

    if (!savedA && !savedB) {
        applyCombinedRosterFilters();
        return;
    }

    const names = [savedA, savedB].map(value => String(value).trim()).filter(Boolean);
    if (names.length === 0) {
        applyCombinedRosterFilters();
        return;
    }

    const fighterA = fighters.find(f => f.name.toLowerCase() === savedA.toLowerCase());
    const fighterB = fighters.find(f => f.name.toLowerCase() === savedB.toLowerCase());

    if (fighterA && fighterB) {
        filterRosterByComparison([fighterA.name, fighterB.name]);
        return;
    }

    const exactMatches = names.filter(name => fighters.some(f => f.name.toLowerCase() === name.toLowerCase()));
    if (exactMatches.length > 0) {
        filterRosterByComparison(exactMatches);
    } else {
        applyCombinedRosterFilters();
    }
}

function clearRosterCompare() {
    const inputA = document.getElementById('compareFighterA');
    const inputB = document.getElementById('compareFighterB');
    if (inputA) inputA.value = '';
    if (inputB) inputB.value = '';
    
    // Clear compare state from localStorage
    localStorage.removeItem('wwe_roster_compare_fighter_a');
    localStorage.removeItem('wwe_roster_compare_fighter_b');
    
    updateRosterCompareDatalists();
    renderRosterGrid();
}

function getWinRate(fighter) {
    const wins = Number(fighter.wins || 0);
    const losses = Number(fighter.losses || 0);
    const total = wins + losses;
    return total === 0 ? 0 : Math.round((wins / total) * 100);
}

function getChampionshipCount(fighter) {
    const championships = JSON.parse(localStorage.getItem('wwe_titles')) || [];
    return championships.filter(b => b.championId === fighter.id).length;
}

function championshipsForFighter(fighter) {
    const championships = JSON.parse(localStorage.getItem('wwe_titles')) || [];
    return championships.filter(b => b.championId === fighter.id);
}

function getChampionshipCount(fighter) {
    return championshipsForFighter(fighter).length;
}


function setupSidebarFormEngine() {
    const form = document.getElementById('fighterForm');
    const addBtn = document.getElementById('addFighterButton');
    const nameInput = document.getElementById('fighterName');
    const genderSelect = document.getElementById('fighterGender');
    const divisionSelect = document.getElementById('fighterDivision');
    const bossTierInput = document.getElementById('fighterBossTier');
    if (!form || !addBtn || !nameInput || !genderSelect || !divisionSelect || addBtn.dataset.addHandlerBound === 'true') return;

    if (bossTierInput) {
        bossTierInput.checked = sessionStorage.getItem(BOSS_TIER_DRAFT_SESSION_KEY) === 'true';
        bossTierInput.addEventListener('change', () => {
            sessionStorage.setItem(BOSS_TIER_DRAFT_SESSION_KEY, String(bossTierInput.checked));
        });
    }

    addBtn.removeAttribute('onclick');
    addBtn.dataset.addHandlerBound = 'true';
    addBtn.addEventListener('click', async event => {
        event.preventDefault();
        const name = nameInput.value.trim();
        if (!name) {
            alert('Please enter a fighter name.');
            nameInput.focus();
            return;
        }

        const gender = genderSelect.value.toLowerCase();
        if (gender !== 'male' && gender !== 'female') {
            alert('Please select a valid gender.');
            return;
        }

        const division = normalizeDivisionName(divisionSelect.value);
        if (!division) {
            alert('Please select a valid division or weight class.');
            return;
        }

        addBtn.disabled = true;
        try {
            await loadAndHydrateFighters();
            const nameKey = normalizeLookupKey(name);
            if (fighters.some(fighter => normalizeLookupKey(fighter.name) === nameKey)) {
                alert(`"${name}" is already in the roster.`);
                nameInput.focus();
                return;
            }

            const newFighter = normalizeFighterRecord({
                id: `f-${Date.now()}`,
                name,
                gender,
                division,
                is_boss: bossTierInput?.checked === true,
                boss_slays: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                win_streak: 0,
                rebuild_wins_required: 0,
                rebuild_loss_count: 0,
                title_comeback_completed: false,
                peak_win_streak: 0,
                pin_wins: 0,
                ko_wins: 0,
                sub_wins: 0,
                countout_wins: 0,
                dq_wins: 0,
                win_pinfall: 0,
                win_ko: 0,
                win_submission: 0,
                defenses: 0,
                title_fights: 0,
                total_title_fights: 0,
                lifetime_defenses: 0,
                current_titles: [],
                retired: false,
                image: '',
                photo: ''
            });
            if (!newFighter) throw new Error('The new fighter record could not be created.');

            fighters.push(newFighter);
            assignAutoDivision(fighters);
            saveFighters(fighters);

            const savedRoster = JSON.parse(localStorage.getItem('wwe_fighters') || '[]');
            const savedFighter = Array.isArray(savedRoster)
                ? savedRoster.find(fighter => fighter.id === newFighter.id)
                : null;
            if (!savedFighter || savedFighter.is_boss !== newFighter.is_boss) {
                fighters.pop();
                throw new Error('The fighter could not be saved with the selected Boss Tier status.');
            }

            window.fighters = fighters;
            nameInput.value = '';
            if (window._renderRosterTimer) {
                clearTimeout(window._renderRosterTimer);
                window._renderRosterTimer = null;
            }
            renderRosterGrid();
        } catch (error) {
            console.error('Failed to add fighter to roster:', error);
            alert(`The fighter could not be added: ${error.message || 'An unexpected error occurred.'}`);
        } finally {
            addBtn.disabled = false;
        }
    });
}

function setupLiveSearchEngine() {
    const searchBar = document.querySelector('input[placeholder*="Search"]') || document.querySelector('input[id*="Search"]') || document.querySelector('input[type="text"]:nth-of-type(2)');
    if (!searchBar) return;

    searchBar.id = 'rosterSearchInput';
    
    // Restore search query from localStorage
    const savedSearch = localStorage.getItem('wwe_roster_search_query') || '';
    if (savedSearch) {
        searchBar.value = savedSearch;
        filterRosterCards();
    }
    
    searchBar.onkeyup = filterRosterCards;
}

window.filterRosterCards = function() {
    const input = document.getElementById('rosterSearchInput');
    const query = (input ? input.value : '').trim().toLowerCase();

    localStorage.setItem('wwe_roster_search_query', query);
    scheduleRenderRosterGrid(100);
};

window.toggleBulkImporter = function() {
    const wrapper = document.getElementById('bulkImporterWrapper');
    if (!wrapper) return;
    wrapper.style.display = wrapper.style.display === 'none' ? 'block' : 'none';
};

// window.clearAllFighterRecords was a temporary helper and has been removed.
// If you need a safe reset utility later, ask and I'll implement a guarded version.

window.importBulkSuperstars = async function() {
    await loadAndHydrateFighters();
    const textarea = document.getElementById('bulkNamesInput');
    const genderSelect = document.getElementById('bulkGender');
    const divisionSelect = document.getElementById('bulkDivision');
    if (!textarea) return alert('Bulk importer is unavailable right now.');

    const names = textarea.value.split(/\r?\n/).map(name => name.trim()).filter(Boolean);
    if (names.length === 0) return alert('Enter at least one fighter name to import.');

    const gender = genderSelect ? genderSelect.value : 'male';
    const division = divisionSelect ? divisionSelect.value : 'Heavyweight';
    const timestamp = Date.now();
    let added = 0;

    names.forEach((name, index) => {
        const exists = fighters.some(f => f.name.toLowerCase() === name.toLowerCase());
        if (!exists) {
            fighters.push(normalizeFighterRecord({
                id: `f-${timestamp}-${index}`,
                name,
                gender,
                division,
                wins: 0,
                losses: 0,
                defenses: 0,
                title_fights: 0,
                total_title_fights: 0,
                win_pinfall: 0,
                win_ko: 0,
                win_submission: 0
            }));
            added++;
        }
    });

    assignAutoDivision(fighters);
    saveFighters(fighters);
    refreshFighterNameDatalist();
    scheduleRenderRosterGrid();
    textarea.value = '';
    alert(`${added} ${added === 1 ? 'superstar' : 'superstars'} imported successfully.`);
};

window.syncWWE2K24Roster = async function() {
    await loadAndHydrateFighters();
    const existingKeys = fighters.map(f => normalizeLookupKey(f.name));
    let added = 0;
    let updated = 0;
    const timestamp = Date.now();

    wwe2k24RosterNamesList.forEach((name, index) => {
        const nameKey = normalizeLookupKey(name);
        const existing = fighters.find(f => normalizeLookupKey(f.name) === nameKey);
        const gender = existing ? (existing.gender || 'male') : getRosterGenderFromName(name);
        const suggestedDivision = getRosterDivisionForName(name, gender) || (gender === 'female' ? 'Light HeavyWeight' : 'Heavyweight');
        const portrait = getWWE2K24Portrait(name);

        if (existing) {
            let changed = false;
            if (existing.division !== suggestedDivision) {
                existing.division = suggestedDivision;
                changed = true;
            }
            if ((!existing.photo || existing.photo.trim() === '') && portrait) {
                existing.photo = portrait;
                changed = true;
            }
            if (changed) updated++;
            return;
        }

        fighters.push(normalizeFighterRecord({
            id: `f-${timestamp}-${index}`,
            name,
            gender,
            division: suggestedDivision,
            wins: 0,
            losses: 0,
            defenses: 0,
            title_fights: 0,
            total_title_fights: 0,
            win_pinfall: 0,
            win_ko: 0,
            win_submission: 0,
            photo: portrait
        }));
        added++;
    });

    if (added || updated) {
        saveFighters(fighters);
        refreshFighterNameDatalist();
        scheduleRenderRosterGrid();
    }

    alert(`WWE 2K24 sync complete. Added ${added} new fighter${added === 1 ? '' : 's'} and updated ${updated} existing fighter${updated === 1 ? '' : 's'}.`);
};

function closeEditFighterModal() {
    const modal = document.getElementById('editFighterModal');
    if (!modal) return;
    if (modal._onEscape) modal.removeEventListener('keydown', modal._onEscape);
    modal.remove();
    document.body.classList.remove('roster-edit-open');
    if (modal._previousFocus?.isConnected) modal._previousFocus.focus();
}

window.editSuperstar = function(id) {
    const fighter = fighters.find(item => String(item.id) === String(id));
    if (!fighter) return;

    if (window._renderRosterTimer) {
        clearTimeout(window._renderRosterTimer);
        window._renderRosterTimer = null;
    }
    closeEditFighterModal();

    const modal = document.createElement('div');
    modal.id = 'editFighterModal';
    modal.className = 'roster-edit-backdrop';
    modal.setAttribute('role', 'presentation');
    modal._previousFocus = document.activeElement;
    const editBadges = [
        typeof window.getFighterStyleBadge === 'function' ? window.getFighterStyleBadge(fighter) : '',
        getGiantKillerBadgeHtml(fighter),
        fighter.is_boss === true ? '<span class="boss-tier-badge">☠️ BOSS TIER</span>' : ''
    ].filter(Boolean).join('');
    modal.innerHTML = `
        <section class="roster-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="editFighterTitle" tabindex="-1">
            <header class="roster-edit-header">
                <div>
                    <h2 id="editFighterTitle">Edit Fighter</h2>
                    <p>Update roster identity and career statistics.</p>
                    <div class="roster-edit-badges">${editBadges}</div>
                </div>
                <button type="button" class="roster-edit-close" data-edit-close aria-label="Close editor">×</button>
            </header>
            <form id="editFighterForm" novalidate>
                <div class="roster-edit-fields">
                    <label class="roster-edit-field roster-edit-field--full">Fighter Name
                        <input name="name" type="text" autocomplete="off" required>
                    </label>
                    <label class="roster-edit-field">Gender
                        <select name="gender" required>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </label>
                    <label class="roster-edit-field">Weight Class
                        <select name="division" required>
                            <option value="Cruiser Weight">Cruiser Weight</option>
                            <option value="Light HeavyWeight">Light HeavyWeight</option>
                            <option value="HeavyWeight">HeavyWeight</option>
                            <option value="Super HeavyWeight">Super HeavyWeight</option>
                        </select>
                    </label>
                    <label class="roster-edit-field roster-edit-field--checkbox">
                        <input name="is_boss" type="checkbox">
                        <span>☠️ Mythic / Boss Tier</span>
                    </label>
                    <label class="roster-edit-field">Wins
                        <input name="wins" type="number" min="0" step="1" inputmode="numeric" required>
                    </label>
                    <label class="roster-edit-field">Losses
                        <input name="losses" type="number" min="0" step="1" inputmode="numeric" required>
                    </label>
                    <label class="roster-edit-field">Active Win Streak
                        <input name="win_streak" type="number" min="0" step="1" inputmode="numeric" required>
                    </label>
                    <label class="roster-edit-field">Active Losing Streak
                        <input name="lose_streak" type="number" min="0" step="1" inputmode="numeric" required>
                    </label>
                    <label class="roster-edit-field">Pin Wins
                        <input name="pin_wins" type="number" min="0" step="1" inputmode="numeric" required>
                    </label>
                    <label class="roster-edit-field">KO Wins
                        <input name="ko_wins" type="number" min="0" step="1" inputmode="numeric" required>
                    </label>
                    <label class="roster-edit-field">Submission Wins
                        <input name="sub_wins" type="number" min="0" step="1" inputmode="numeric" required>
                    </label>
                    <label class="roster-edit-field">Count-Out Wins
                        <input name="countout_wins" type="number" min="0" step="1" inputmode="numeric" required>
                    </label>
                    <label class="roster-edit-field">DQ Wins
                        <input name="dq_wins" type="number" min="0" step="1" inputmode="numeric" required>
                    </label>
                    <label class="roster-edit-field">Total Title Fights
                        <input name="total_title_fights" type="number" min="0" step="1" inputmode="numeric" required>
                    </label>
                    <label class="roster-edit-field">Lifetime Defenses
                        <input name="lifetime_defenses" type="number" min="0" step="1" inputmode="numeric" required>
                    </label>
                </div>
                <div class="roster-edit-actions">
                    <button type="submit" class="roster-edit-save">Save Changes</button>
                    <button type="button" class="roster-edit-photo" data-edit-delete-photo>Delete Photo</button>
                    <button type="button" class="roster-edit-cancel" data-edit-close>Cancel</button>
                </div>
            </form>
        </section>`;

    const form = modal.querySelector('#editFighterForm');
    form.dataset.fighterId = String(fighter.id);
    const values = {
        name: fighter.name || '',
        gender: String(fighter.gender || 'male').toLowerCase(),
        division: normalizeDivisionName(fighter.division || fighter.weightClass || 'HeavyWeight'),
        is_boss: fighter.is_boss === true,
        wins: Number(fighter.wins) || 0,
        losses: Number(fighter.losses) || 0,
        win_streak: getRosterWinStreak(fighter),
        lose_streak: Math.max(0, Math.floor(Number(fighter.lose_streak) || 0)),
        pin_wins: Number(fighter.win_pinfall || fighter.pin_wins || 0),
        ko_wins: Number(fighter.win_ko || fighter.ko_wins || 0),
        sub_wins: Number(fighter.win_submission || fighter.sub_wins || 0),
        countout_wins: Number(fighter.countout_wins) || 0,
        dq_wins: Number(fighter.dq_wins) || 0,
        total_title_fights: Number(fighter.total_title_fights ?? fighter.title_fights) || 0,
        lifetime_defenses: Number(fighter.lifetime_defenses) || 0
    };

    Object.entries(values).forEach(([name, value]) => {
        const field = form.elements.namedItem(name);
        if (!field) return;
        if (name === 'is_boss') {
            field.checked = value;
            return;
        }
        if (name === 'division' && !Array.from(field.options).some(option => option.value === value)) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            field.appendChild(option);
        }
        field.value = value;
    });

    form.dataset.winStreakEdited = 'false';
    form.dataset.loseStreakEdited = 'false';
    form.elements.namedItem('win_streak').addEventListener('input', () => {
        form.dataset.winStreakEdited = 'true';
    });
    form.elements.namedItem('lose_streak').addEventListener('input', () => {
        form.dataset.loseStreakEdited = 'true';
    });

    document.body.appendChild(modal);
    document.body.classList.add('roster-edit-open');
    modal.addEventListener('click', event => {
        if (event.target === modal) closeEditFighterModal();
        if (event.target.closest('[data-edit-close]')) closeEditFighterModal();
    });
    modal._onEscape = event => {
        if (event.key === 'Escape') closeEditFighterModal();
    };
    modal.addEventListener('keydown', modal._onEscape);
    form.addEventListener('submit', event => {
        event.preventDefault();
        window.saveInlineEdit(fighter.id);
    });
    modal.querySelector('[data-edit-delete-photo]').addEventListener('click', async () => {
        await window.deleteFighterPhoto(fighter.id, true);
        if (!fighter.photo && !fighter.photo_key) closeEditFighterModal();
    });
    form.elements.namedItem('name').focus();
};

window.saveInlineEdit = function(id) {
    const fighter = fighters.find(item => String(item.id) === String(id));
    const modal = document.getElementById('editFighterModal');
    const form = modal?.querySelector('#editFighterForm');
    if (!fighter || !form) return;

    const nameField = form.elements.namedItem('name');
    const genderField = form.elements.namedItem('gender');
    const divisionField = form.elements.namedItem('division');
    const isBossField = form.elements.namedItem('is_boss');
    const newName = nameField.value.trim();
    const newGender = String(genderField.value || '').toLowerCase();
    const newDivision = normalizeDivisionName(divisionField.value);
    if (!newName) {
        alert('Fighter name cannot be empty.');
        nameField.focus();
        return;
    }
    if (!['male', 'female'].includes(newGender) || !newDivision) {
        alert('Choose a valid gender and weight class.');
        return;
    }
    if (newName !== String(fighter.name || '').trim()) {
        const duplicate = fighters.find(item =>
            item !== fighter && normalizeLookupKey(item.name) === normalizeLookupKey(newName)
        );
        if (duplicate) {
            alert('A fighter with that name is already in the roster.');
            nameField.focus();
            return;
        }
    }

    const numericFields = [
        'wins', 'losses', 'win_streak', 'lose_streak', 'pin_wins', 'ko_wins', 'sub_wins',
        'countout_wins', 'dq_wins', 'total_title_fights', 'lifetime_defenses'
    ];
    const stats = {};
    for (const name of numericFields) {
        const field = form.elements.namedItem(name);
        const rawValue = field.value.trim();
        const value = Number(rawValue);
        if (!rawValue || !Number.isSafeInteger(value) || value < 0) {
            alert(`${field.labels?.[0]?.textContent || name} must be a non-negative whole number.`);
            field.focus();
            return;
        }
        stats[name] = value;
    }

    const explicitLowerWinStreak = stats.losses === 0 && stats.wins > 0 &&
        form.dataset.winStreakEdited === 'true' && stats.win_streak < stats.wins;
    if (stats.losses === 0 && stats.wins > 0 && !explicitLowerWinStreak) {
        stats.win_streak = stats.wins;
    }
    if (form.dataset.loseStreakEdited !== 'true' && stats.losses > Number(fighter.losses || 0)) {
        stats.lose_streak = Math.max(0, Number(fighter.lose_streak) || 0) +
            stats.losses - Number(fighter.losses || 0);
        stats.win_streak = 0;
    }
    if (form.dataset.loseStreakEdited === 'true' && stats.lose_streak > 0) {
        stats.win_streak = 0;
    } else if (form.dataset.winStreakEdited === 'true' && stats.win_streak > 0) {
        stats.lose_streak = 0;
    }

    const titleRules = getRosterTitleRules();
    let rebuildWinsRequired = Math.max(0, Math.floor(Number(fighter.rebuild_wins_required) || 0));
    let rebuildLossCount = getRosterRebuildLossCount(fighter, rebuildWinsRequired);
    let titleComebackCompleted = fighter.title_comeback_completed === true;
    let dominantExChampionRebuild = fighter.dominant_ex_champ_rebuild === true;
    const addedLosses = Math.max(0, stats.losses - Number(fighter.losses || 0));
    if (addedLosses > 0) {
        for (let loss = 0; loss < addedLosses; loss++) {
            rebuildLossCount = rebuildWinsRequired > 0 ? rebuildLossCount + 1 : 1;
            rebuildWinsRequired = getRosterRebuildWinsRequired(rebuildLossCount, titleRules);
        }
        titleComebackCompleted = false;
        dominantExChampionRebuild = false;
        stats.win_streak = 0;
    } else if (rebuildWinsRequired > 0 && stats.win_streak >= rebuildWinsRequired) {
        rebuildWinsRequired = 0;
        rebuildLossCount = 0;
        titleComebackCompleted = true;
        dominantExChampionRebuild = false;
    } else if (rebuildWinsRequired === 0) {
        rebuildLossCount = 0;
        dominantExChampionRebuild = false;
        titleComebackCompleted = titleComebackCompleted &&
            stats.win_streak >= Number(fighter.win_streak || 0);
        if (stats.win_streak >= titleRules.initialTitleWins) titleComebackCompleted = false;
    }

    const previousFighter = { ...fighter };
    const peakWinStreak = Math.max(
        0,
        Math.floor(Number(fighter.peak_win_streak) || 0),
        stats.win_streak
    );
    fighter.name = newName;
    fighter.gender = newGender;
    fighter.division = newDivision;
    fighter.is_boss = isBossField.checked;
    if (Object.prototype.hasOwnProperty.call(fighter, 'weightClass')) fighter.weightClass = newDivision;
    fighter.wins = stats.wins;
    fighter.losses = stats.losses;
    fighter.win_streak = stats.win_streak;
    fighter.rebuild_wins_required = rebuildWinsRequired;
    fighter.rebuild_loss_count = rebuildLossCount;
    fighter.title_comeback_completed = titleComebackCompleted;
    fighter.dominant_ex_champ_rebuild = dominantExChampionRebuild;
    fighter.peak_win_streak = peakWinStreak;
    fighter.lose_streak = stats.lose_streak;
    fighter.win_pinfall = stats.pin_wins;
    fighter.pin_wins = stats.pin_wins;
    fighter.win_ko = stats.ko_wins;
    fighter.ko_wins = stats.ko_wins;
    fighter.win_submission = stats.sub_wins;
    fighter.sub_wins = stats.sub_wins;
    fighter.countout_wins = stats.countout_wins;
    fighter.dq_wins = stats.dq_wins;
    fighter.total_title_fights = stats.total_title_fights;
    fighter.title_fights = stats.total_title_fights;
    fighter.lifetime_defenses = stats.lifetime_defenses;
    fighter.manual_stats_override = true;
    fighter.manual_win_streak_override = explicitLowerWinStreak;

    saveFighters(fighters);
    let persistedRoster;
    try {
        persistedRoster = JSON.parse(localStorage.getItem('wwe_fighters') || '[]');
    } catch (error) {
        persistedRoster = null;
        console.error('Unable to verify saved fighter edits.', error);
    }
    const persistedFighter = Array.isArray(persistedRoster)
        ? persistedRoster.find(item => String(item.id) === String(fighter.id))
        : null;
    const savedValuesMatch = persistedFighter &&
        persistedFighter.name === newName &&
        persistedFighter.gender === newGender &&
        persistedFighter.division === newDivision &&
        persistedFighter.is_boss === isBossField.checked &&
        Number(persistedFighter.rebuild_wins_required) === rebuildWinsRequired &&
        Number(persistedFighter.rebuild_loss_count) === rebuildLossCount &&
        persistedFighter.title_comeback_completed === titleComebackCompleted &&
        persistedFighter.dominant_ex_champ_rebuild === dominantExChampionRebuild &&
        Number(persistedFighter.peak_win_streak) === peakWinStreak &&
        numericFields.every(name => Number(
            name === 'pin_wins' ? (persistedFighter.win_pinfall ?? persistedFighter.pin_wins) :
            name === 'ko_wins' ? (persistedFighter.win_ko ?? persistedFighter.ko_wins) :
            name === 'sub_wins' ? (persistedFighter.win_submission ?? persistedFighter.sub_wins) :
            persistedFighter[name]
        ) === stats[name]) &&
        persistedFighter.manual_stats_override === true &&
        persistedFighter.manual_win_streak_override === explicitLowerWinStreak;
    if (!savedValuesMatch) {
        Object.keys(fighter).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(previousFighter, key)) delete fighter[key];
        });
        Object.assign(fighter, previousFighter);
        alert('The fighter changes could not be saved. Your previous roster values were restored.');
        return;
    }

    closeEditFighterModal();
    refreshFighterNameDatalist();
    renderRosterGrid();
};

window.sortRosterByMetric = function(metricType) {
    if (!fighters || fighters.length === 0) return;
    if (activeRosterQuickFilter === 'hall_of_fame') activeRosterQuickFilter = 'all';

    const divisionFilters = {
        division_cruiser: 'Cruiser Weight',
        division_light_heavy: 'Light HeavyWeight',
        division_heavy: 'HeavyWeight',
        division_super_heavy: 'Super HeavyWeight'
    };
    if (metricType === 'gender_male' || metricType === 'gender_female' || divisionFilters[metricType]) {
        const alphabetical = (a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
        const matchesFilter = fighter => {
            if (metricType === 'gender_male' || metricType === 'gender_female') {
                return String(fighter.gender || '').toLowerCase() === metricType.slice('gender_'.length);
            }
            const division = fighter.division || fighter.weightClass;
            return !!division && normalizeDivisionName(division) === divisionFilters[metricType];
        };
        const matching = fighters.filter(matchesFilter).sort(alphabetical);
        const remaining = fighters.filter(fighter => !matchesFilter(fighter)).sort(alphabetical);
        fighters = matching.concat(remaining);
    } else if (metricType === 'alphabetical') {
        fighters.sort((a, b) => a.name.localeCompare(b.name));
    } else if (metricType === 'win_rate') {
        fighters.sort((a, b) => {
            let totalA = a.wins + a.losses;
            let totalB = b.wins + b.losses;
            let rateA = totalA === 0 ? 0 : a.wins / totalA;
            let rateB = totalB === 0 ? 0 : b.wins / totalB;
            return rateB - rateA || b.wins - a.wins;
        });
    } else if (metricType === 'current_belts') {
        const championships = JSON.parse(localStorage.getItem('wwe_titles')) || [];
        fighters.sort((a, b) => {
            const beltsA = championships.filter(c => c.championId === a.id).length;
            const beltsB = championships.filter(c => c.championId === b.id).length;
            return beltsB - beltsA || b.wins - a.wins;
        });
    } else if (metricType === 'fights') {
        fighters.sort((a, b) => {
            const fightsA = (Number(a.wins) || 0) + (Number(a.losses) || 0);
            const fightsB = (Number(b.wins) || 0) + (Number(b.losses) || 0);
            return fightsB - fightsA || b.wins - a.wins;
        });
    } else if (metricType === 'defenses') {
        fighters.sort((a, b) => {
            const defensesA = Number(a.lifetime_defenses) || 0;
            const defensesB = Number(b.lifetime_defenses) || 0;
            return defensesB - defensesA || b.wins - a.wins;
        });
    } else {
        fighters.sort((a, b) => (b[metricType] || 0) - (a[metricType] || 0));
    }
    // Cancel any pending debounced render to avoid it overwriting this immediate sorted state
    try {
        if (window._renderRosterTimer) {
            clearTimeout(window._renderRosterTimer);
            window._renderRosterTimer = null;
        }
    } catch (e) {}
    renderRosterGrid();
};

window.fireSuperstar = function(id) {
    if (confirm("Release this competitor from their contract? This will remove them completely from your Universe roster!")) {
        fighters = fighters.filter(f => f.id !== id);
        saveFighters(fighters);
        scheduleRenderRosterGrid();
    }
};

window.uploadFighterPhoto = function(fighterId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            openPhotoCropDialog(event.target.result, fighterId, true);
        };
        reader.readAsDataURL(file);
    };
    input.click();
};

window.openPhotoCropDialog = function(imageSrc, fighterId, isRoster) {
    if (document.getElementById('photoCropDialog')) {
        document.getElementById('photoCropDialog').remove();
    }

    const dialog = document.createElement('div');
    dialog.id = 'photoCropDialog';
    dialog.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:5000; display:flex; align-items:center; justify-content:center;';

    dialog.innerHTML = `
        <div style="background:white; border-radius:12px; padding:20px; max-width:500px; width:90%; box-shadow:0 10px 40px rgba(0,0,0,0.3);">
            <h3 style="margin:0 0 16px 0; color:#0f172a; font-weight:800;">Crop Fighter Photo</h3>
            <div style="position:relative; width:100%; height:300px; background:#f1f5f9; border-radius:8px; overflow:hidden; margin-bottom:16px; display:flex; align-items:center; justify-content:center;">
                <img id="cropImagePreview" src="${imageSrc}" style="max-width:100%; max-height:100%; cursor:grab; user-select:none; object-fit:contain;" draggable="false">
                <div id="cropFrame" style="position:absolute; width:200px; height:200px; border:2px dashed rgba(0,0,0,0.25); box-shadow:0 6px 16px rgba(0,0,0,0.15); border-radius:8px; pointer-events:none;">
                </div>
            </div>
            <div style="display:flex; gap:12px; align-items:center; margin-bottom:16px;">
                <div style="position:relative; width:150px; height:150px; border:2px solid #0284c7; border-radius:50%; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#f8fafc;">
                    <canvas id="cropCircleCanvas" width="150" height="150" style="width:150px; height:150px; display:block; border-radius:50%;"></canvas>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <div style="font-size:0.85rem; font-weight:700; color:#0f172a;">Avatar Preview</div>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <div style="width:44px; height:44px; border-radius:50%; overflow:hidden; background:#fff; display:flex; align-items:center; justify-content:center;" id="cropSmallContainer">
                            <canvas id="cropSmallCanvas" width="44" height="44" style="width:44px; height:44px; border-radius:50%; display:block;"></canvas>
                        </div>
                        <div style="width:72px; height:72px; border-radius:50%; overflow:hidden; background:#fff; display:flex; align-items:center; justify-content:center;" id="cropMediumContainer">
                            <canvas id="cropMediumCanvas" width="72" height="72" style="width:72px; height:72px; border-radius:50%; display:block;"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div style="display:flex; gap:8px; font-size:0.75rem; color:#64748b; margin-bottom:16px; align-items:center;">
                <span>📏 Position:</span>
                <input type="range" id="cropOffsetX" min="-800" max="800" value="0" style="flex:1;">
                <input type="range" id="cropOffsetY" min="-800" max="800" value="0" style="flex:1;">
                <input type="range" id="cropZoom" min="10" max="400" value="100" style="flex:1;">
                <!-- Center on face removed — manual positioning controls only -->
            </div>
            <div style="display:flex; gap:8px;">
                <button onclick="saveCroppedPhoto('${fighterId}', ${isRoster ? 'true' : 'false'})" style="flex:1; background:#10b981; border:none; color:white; font-weight:bold; padding:10px; border-radius:6px; cursor:pointer;">✓ Save Photo</button>
                <button onclick="deleteFighterPhoto('${fighterId}', ${isRoster ? 'true' : 'false'})" style="flex:1; background:#f97316; border:none; color:white; font-weight:bold; padding:10px; border-radius:6px; cursor:pointer;">🗑️ Delete Photo</button>
                <button onclick="document.getElementById('photoCropDialog').remove()" style="flex:1; background:#ef4444; border:none; color:white; font-weight:bold; padding:10px; border-radius:6px; cursor:pointer;">✕ Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);

    const previewImg = document.getElementById('cropImagePreview');
    const circleCanvas = document.getElementById('cropCircleCanvas');
    const smallCanvas = document.getElementById('cropSmallCanvas');
    const mediumCanvas = document.getElementById('cropMediumCanvas');
    const offsetXSlider = document.getElementById('cropOffsetX');
    const offsetYSlider = document.getElementById('cropOffsetY');
    const zoomSlider = document.getElementById('cropZoom');
    let isGrabbing = false;
    let grabStartX = 0, grabStartY = 0;

    // create a shared source image so we avoid reloading during drags
    const srcImage = new Image();
    srcImage.crossOrigin = 'anonymous';
    srcImage.src = imageSrc;
    window._rosterCropSrcImage = srcImage;
    srcImage.onload = function() {
        // Choose a conservative default zoom that tends to show head+shoulders
        try {
            // target a scaled image height slightly larger than the crop (150% of 200) so shoulders are visible
            const targetCropHeight = 200 * 1.5; // 300
            let initialZoom = Math.round((targetCropHeight / srcImage.naturalHeight) * 100);
            // clamp to sane bounds
            if (initialZoom < 10) initialZoom = 10;
            if (initialZoom > 200) initialZoom = 200;
            if (zoomSlider) zoomSlider.value = initialZoom;
            if (offsetXSlider) offsetXSlider.value = 0;
            if (offsetYSlider) offsetYSlider.value = 0;
        } catch (e) { /* ignore */ }
        updatePreview();
    };

    const drawPreviewToCanvas = (canvas, size) => {
        if (!srcImage || !srcImage.naturalWidth) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0,0,canvas.width,canvas.height);
        // circular clip
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, canvas.width/2, 0, Math.PI*2);
        ctx.clip();

        const offsetX = parseInt(offsetXSlider.value, 10) || 0;
        const offsetY = parseInt(offsetYSlider.value, 10) || 0;
        const zoom = parseInt(zoomSlider.value, 10) || 100;

        const scale = zoom / 100;
        const scaledWidth = srcImage.naturalWidth * scale;
        const scaledHeight = srcImage.naturalHeight * scale;
        // map saved-canvas-space (200px) to this preview canvas size
        const factor = size / 200;
        const dstWidth = scaledWidth * factor;
        const dstHeight = scaledHeight * factor;
        const x = size/2 - dstWidth/2 + offsetX * factor;
        const y = size/2 - dstHeight/2 + offsetY * factor;
        ctx.drawImage(srcImage, x, y, dstWidth, dstHeight);
        ctx.restore();
    };

    const updatePreview = () => {
        // update frame position
        const frame = document.getElementById('cropFrame');
        if (frame) {
            frame.style.left = `calc(50% - ${frame.offsetWidth/2}px)`;
            frame.style.top = `calc(50% - ${frame.offsetHeight/2}px)`;
        }
        if (srcImage && srcImage.complete) {
            drawPreviewToCanvas(circleCanvas, 150);
            drawPreviewToCanvas(smallCanvas, 44);
            drawPreviewToCanvas(mediumCanvas, 72);
        }
    };

    previewImg.addEventListener('mousedown', (e) => {
        isGrabbing = true;
        grabStartX = e.clientX;
        grabStartY = e.clientY;
        previewImg.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isGrabbing) return;
        const deltaX = e.clientX - grabStartX;
        const deltaY = e.clientY - grabStartY;
        // Apply pixel deltas directly to offset sliders
        const newX = Math.max(parseInt(offsetXSlider.min, 10), Math.min(parseInt(offsetXSlider.max, 10), parseInt(offsetXSlider.value || 0, 10) + deltaX));
        const newY = Math.max(parseInt(offsetYSlider.min, 10), Math.min(parseInt(offsetYSlider.max, 10), parseInt(offsetYSlider.value || 0, 10) + deltaY));
        offsetXSlider.value = newX;
        offsetYSlider.value = newY;
        grabStartX = e.clientX;
        grabStartY = e.clientY;
        updatePreview();
    });

    document.addEventListener('mouseup', () => {
        isGrabbing = false;
        previewImg.style.cursor = 'grab';
    });

    offsetXSlider.addEventListener('input', updatePreview);
    offsetYSlider.addEventListener('input', updatePreview);
    zoomSlider.addEventListener('input', updatePreview);

    // Face detection centering
    // FaceDetector removed per user request — manual positioning only

    updatePreview();
};

// ensure small preview images update if dialog reopened

window.saveCroppedPhoto = async function(fighterId, isRoster) {
    const offsetXSlider = document.getElementById('cropOffsetX');
    const offsetYSlider = document.getElementById('cropOffsetY');
    const zoomSlider = document.getElementById('cropZoom');

    const offsetX = parseInt(offsetXSlider.value, 10) || 0;
    const offsetY = parseInt(offsetYSlider.value, 10) || 0;
    const zoom = parseInt(zoomSlider.value, 10) || 100;

    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);
    ctx.beginPath();
    ctx.arc(100, 100, 100, 0, Math.PI * 2);
    ctx.clip();

    const srcImage = window._rosterCropSrcImage || new Image();
    const performSave = async () => {
        const scale = zoom / 100;
        const scaledWidth = srcImage.naturalWidth * scale;
        const scaledHeight = srcImage.naturalHeight * scale;
        const x = canvas.width / 2 - scaledWidth / 2 + offsetX;
        const y = canvas.height / 2 - scaledHeight / 2 + offsetY;
        ctx.drawImage(srcImage, x, y, scaledWidth, scaledHeight);

        const croppedPhoto = canvas.toDataURL('image/jpeg');
        const fighter = fighters.find(f => f.id === fighterId);
        if (!fighter) return;

        let saved = false;
        const photoKey = fighter.photo_key || `fighter-photo-${fighter.id}`;

        const tryIDBDirect = async () => {
            try {
                await storeFighterPhotoInIDB(photoKey, croppedPhoto);
                fighter.photo_key = photoKey;
                fighter.photo = croppedPhoto;
                saveFighters(fighters);
                return true;
            } catch (err) {
                console.warn('IDB save failed, trying smaller versions', err);
                return false;
            }
        };

        const tryIDBWithFallbacks = async () => {
            const qualitySteps = [0.7, 0.5, 0.3, 0.1];
            for (let q of qualitySteps) {
                const smaller = canvas.toDataURL('image/jpeg', q);
                try {
                    await storeFighterPhotoInIDB(photoKey, smaller);
                    fighter.photo_key = photoKey;
                    fighter.photo = smaller;
                    saveFighters(fighters);
                    return true;
                } catch (err) {
                    continue;
                }
            }

            const dimensions = [150, 128, 100];
            for (let size of dimensions) {
                const smallCanvas = document.createElement('canvas');
                smallCanvas.width = size;
                smallCanvas.height = size;
                const smallCtx = smallCanvas.getContext('2d');
                smallCtx.fillStyle = '#ffffff';
                smallCtx.fillRect(0, 0, size, size);
                smallCtx.beginPath();
                smallCtx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
                smallCtx.clip();
                const factor = size / 200;
                const xSmall = size / 2 - (srcImage.naturalWidth * zoom / 100) * factor / 2 + offsetX * factor;
                const ySmall = size / 2 - (srcImage.naturalHeight * zoom / 100) * factor / 2 + offsetY * factor;
                const scaledWidth = srcImage.naturalWidth * (zoom / 100) * factor;
                const scaledHeight = srcImage.naturalHeight * (zoom / 100) * factor;
                smallCtx.drawImage(srcImage, xSmall, ySmall, scaledWidth, scaledHeight);

                for (let q of qualitySteps) {
                    const smaller = smallCanvas.toDataURL('image/jpeg', q);
                    try {
                        await storeFighterPhotoInIDB(photoKey, smaller);
                        fighter.photo_key = photoKey;
                        fighter.photo = smaller;
                        saveFighters(fighters);
                        return true;
                    } catch (err) {
                        continue;
                    }
                }
            }
            return false;
        };

        try {
            saved = await tryIDBDirect();
        } catch (err) {
            saved = await tryIDBWithFallbacks();
        }

        if (!saved) {
            alert('Unable to save this image due to an unexpected error. Please try again.');
        }

        const rosterSearch = document.getElementById('rosterSearchInput');
        const searchQuery = rosterSearch ? rosterSearch.value : '';
        const hadFocus = document.activeElement === rosterSearch;
        if (isRoster) {
            await hydrateRosterFighterPhotos();
            scheduleRenderRosterGrid();
            const rs = document.getElementById('rosterSearchInput');
            if (rs) {
                rs.value = searchQuery;
                filterRosterCards();
                if (hadFocus) rs.focus();
            }
            setTimeout(() => {
                const el = document.getElementById(`fighter-card-${fighterId}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
        }
    };

    if (srcImage && srcImage.naturalWidth) {
        await performSave();
    } else {
        srcImage.crossOrigin = 'anonymous';
        srcImage.src = document.getElementById('cropImagePreview').src;
        srcImage.onload = async () => await performSave();
    }

    if (document.getElementById('photoCropDialog')) {
        document.getElementById('photoCropDialog').remove();
    }
};

window.deleteFighterPhoto = async function(fighterId, isRoster) {
    const fighter = fighters.find(f => f.id === fighterId);
    if (!fighter) return;
    if (!confirm(`Delete ${fighter.name}'s photo? This cannot be undone.`)) return;
    
    if (fighter.photo_key) {
        try {
            await deleteFighterPhotoFromIDB(fighter.photo_key);
        } catch (err) {
            console.warn('Failed to delete photo from IDB', err);
        }
    }
    
    delete fighter.photo;
    delete fighter.photo_key;
    saveFighters(fighters);
    
    if (document.getElementById('photoCropDialog')) {
        document.getElementById('photoCropDialog').remove();
    }
    
    if (isRoster) {
        if (typeof scheduleRenderRosterGrid === 'function') scheduleRenderRosterGrid(); else try { renderRosterGrid(); } catch(e){}
    }
};
