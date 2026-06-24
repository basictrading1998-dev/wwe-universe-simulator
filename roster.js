let fighters = [];

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

const wwe2k24PortraitMap = {
    'Roman Reigns': 'https://www.wwe.com/f/styles/talent_champion_xl/public/2026/05/Roman_Reigns_PROFILE.png',
    'Seth “Freakin” Rollins': 'https://www.wwe.com/f/styles/talent_champion_xl/public/2026/05/SETH_ROLLINS_04132026sb_0095_Profile.png',
    'Cody Rhodes': 'https://www.wwe.com/f/styles/talent_champion_xl/public/2026/03/CODY_04262024gd_0100_headSawp_Profile.png',
    'Liv Morgan': 'https://www.wwe.com/f/styles/talent_champion_xl/public/all/2024/06/LIV_05132024ca_023_Title_Profile--530195974e3839e08bdb34e41adbaed5.png',
    'Rhea Ripley': 'https://www.wwe.com/f/styles/talent_champion_xl/public/2026/04/Rhea_04242026ca_037_Profile.png',
    'Bianca Belair': 'https://www.wwe.com/f/styles/talent_champion_xl/public/2024/03/BiancaBelair_01282024RF_1159_Profile--f32b01959da5065b6d2b2b9887792b92.png',
    'The Rock': 'https://www.wwe.com/f/styles/talent_champion_xl/public/all/2024/03/The_Rock_PROFILE--927b15797eefad54a3bca4d2a15e4921.png'
};

const wwe2k24PortraitMapNormalized = Object.keys(wwe2k24PortraitMap).reduce((acc, name) => {
    acc[normalizeLookupKey(name)] = wwe2k24PortraitMap[name];
    return acc;
}, {});

const maleDivisionLookupNormalized = Object.keys(maleDivisionLookup).reduce((acc, name) => {
    acc[normalizeLookupKey(name)] = maleDivisionLookup[name];
    return acc;
}, {});

function normalizeLookupKey(value) {
    return (value || '').toString().normalize('NFC').trim().toLowerCase()
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
        .replace(/[\u2010-\u2015]/g, '-')
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ');
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
    return wwe2k24PortraitMapNormalized[normalizeLookupKey(name)] || '';
}

function normalizeDivisionName(division) {
    const normalized = (division || '').toString().trim().toLowerCase();
    if (normalized.includes('cruiser')) return 'Cruiser Weight';
    if (normalized.includes('light heavy')) return 'Light HeavyWeight';
    if (normalized.includes('super heavy')) return 'Super HeavyWeight';
    if (normalized.includes('heavy')) return 'HeavyWeight';
    return division || 'HeavyWeight';
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
        if (!mappedDivision) return;
        const canonicalDivision = normalizeDivisionName(mappedDivision);
        if (f.division !== canonicalDivision) {
            f.division = canonicalDivision;
            rosterChanged = true;
        }
    });
    return rosterChanged;
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
    normalized.title_fights = Number(normalized.title_fights || 0);
    normalized.win_pinfall = Number(normalized.win_pinfall || 0);
    normalized.win_ko = Number(normalized.win_ko || 0);
    normalized.win_submission = Number(normalized.win_submission || 0);
    normalized.photo = normalized.photo || '';
    return normalized;
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
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(normalizeFighterRecord).filter(Boolean);
    } catch {
        return [];
    }
}

function saveFighters(list = fighters) {
    const normalized = (list || []).map(normalizeFighterRecord).filter(Boolean);
    assignAutoDivision(normalized);
    localStorage.setItem('wwe_fighters', JSON.stringify(normalized));
}

function ensureFemaleRosterEntries() {
    fighters = loadFighters();
    let rosterChanged = false;

    femaleFighterTemplates.forEach(template => {
        const existing = fighters.find(f => f.name.toLowerCase() === template.name.toLowerCase());
        if (existing) {
            const normalizedDivision = template.division.toString();
            if (existing.division !== normalizedDivision || existing.gender !== 'female') {
                existing.division = normalizedDivision;
                existing.gender = 'female';
                rosterChanged = true;
            }
        } else {
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

window.restoreLegacyRoster = function() {
    fighters = loadFighters();
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
        renderRosterGrid();
        alert(`Restored ${restored} missing fighter${restored === 1 ? '' : 's'} from your legacy roster.`);
    } else {
        alert('No additional fighters were found in legacy roster data. Your current roster already has everything loaded.');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    fighters = loadFighters();
    ensureFemaleRosterEntries();
    refreshFighterNameDatalist();
    renderRosterGrid();
    buildMasterRankingsPanel();
    setupSidebarFormEngine();
    setupLiveSearchEngine();
    window.addEventListener('beforeunload', () => saveFighters(fighters));
});

function renderRosterGrid() {
    const grid = document.getElementById('rosterGrid');
    const countBadge = document.getElementById('rosterCount');
    if (!grid) return;

    fighters = loadFighters();
    refreshFighterNameDatalist();
    const championships = JSON.parse(localStorage.getItem('wwe_titles')) || [];

    buildMasterRankingsPanel();

    grid.innerHTML = '';
    if (countBadge) countBadge.textContent = `${fighters.length} Superstars`;

    if (fighters.length === 0) {
        grid.innerHTML = `<div style="grid-column: span 4; background: white; border: 1px dashed #cbd5e1; padding: 40px; text-align: center; font-weight: bold; color: #64748b; border-radius: 12px;">Your locker room is empty. Use the roster form to add your very first wrestler!</div>`;
        return;
    }

    fighters.forEach(f => {
        const card = document.createElement('div');
        card.style.cssText = "background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; align-items: center; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: center;";
        card.id = `fighter-card-${f.id}`;
        
        let rate = (f.wins + f.losses) === 0 ? 0 : Math.round((f.wins / (f.wins + f.losses)) * 100);
        let genderColor = f.gender === 'male' ? '#0284c7' : '#db2777';

        let heldBelts = championships.filter(b => b.championId === f.id);
        let goldBadgesHtml = '';
        
        if (heldBelts.length > 0) {
            card.style.border = '2px solid #eab308';
            card.style.boxShadow = '0 4px 12px rgba(234, 179, 8, 0.15)';
            
            heldBelts.forEach(b => {
                goldBadgesHtml += `<div style="background: #fef9c3; border: 1px solid #fef08a; color: #a16207; font-size: 0.58rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-top: 4px; text-transform: uppercase; display: inline-block;">🏆 ${b.name.replace(' Championship', '')}</div>`;
            });
        }

        let totalDefenses = championships.filter(b => b.championId === f.id).reduce((sum, b) => sum + (b.defenses || 0), 0);
        let titleFightsCount = f.title_fights || 0;

        let avatarContent = '';
        if (f.photo) {
            avatarContent = `<img src="${f.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; object-position: center center; display: block;" alt="${f.name}">`;
        } else {
            avatarContent = `<span style="font-size: 1.25rem; font-weight: bold;">${f.name.charAt(0)}</span>`;
        }

        card.innerHTML = `
            <div onclick="uploadFighterPhoto('${f.id}')" style="width: 44px; height: 44px; background: #f1f5f9; border: 2px solid ${genderColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: bold; color: ${genderColor}; margin-bottom: 8px; cursor: pointer; position: relative; overflow: hidden; transition: 0.2s;">${avatarContent}</div>
            <h4 class="fighter-name-target" style="margin: 0; font-size: 1rem; font-weight: 800; color: #0f172a;">${f.name}</h4>
            <span style="font-size: 0.65rem; font-weight: bold; color: #64748b; text-transform: uppercase; margin-top: 2px;">${f.division} • ${f.gender}</span>
            
            <div style="margin-top: 2px; display: flex; flex-direction: column; gap: 2px; align-items: center;">${goldBadgesHtml}</div>

            <div style="margin-top:8px; display:flex; flex-direction:column; align-items:center; width:100%; box-sizing:border-box;">
                <div style="display:flex; gap:8px; align-items:center;">
                    <span style="background:#052e17; color:#d1fae5; padding:4px 8px; border-radius:8px; font-weight:900; font-size:0.85rem;">${f.wins}W</span>
                    <span style="background:#3b0b0b; color:#fecaca; padding:4px 8px; border-radius:8px; font-weight:900; font-size:0.85rem;">${f.losses}L</span>
                    <span style="font-size:0.65rem; color:#94a3b8; font-weight:700; margin-left:6px;">${rate}%</span>
                </div>
                <div style="margin-top:6px; font-size:0.62rem; color:#64748b; font-weight:800; text-transform:uppercase; letter-spacing:0.02em; display:flex; gap:8px;">
                    <span>🛡️ Defenses: <strong style="color:#0f172a; margin-left:4px;">${totalDefenses}</strong></span>
                    <span>🏅 Belts: <strong style="color:#0f172a; margin-left:4px;">${heldBelts.length}</strong></span>
                    <span>🥊 Title Fights: <strong style="color:#0f172a; margin-left:4px;">${titleFightsCount}</strong></span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; width: 100%; border-top: 1px solid #f1f5f9; padding-top: 6px; font-size: 0.58rem; color: #64748b; gap: 2px;">
                <div><span style="color: #1e293b; display: block; font-weight: bold;">${f.win_pinfall || 0}</span>PINS</div>
                <div><span style="color: #1e293b; display: block; font-weight: bold;">${f.win_ko || 0}</span>KO</div>
                <div><span style="color: #1e293b; display: block; font-weight: bold;">${f.win_submission || 0}</span>SUB</div>
            </div>
            <div style="margin-top: 10px; display: flex; gap: 4px; width: 100%;">
                <button onclick="editSuperstar('${f.id}')" style="flex: 1; background: #f1f5f9; border: none; padding: 4px; border-radius: 4px; font-size: 0.65rem; font-weight: bold; color: #475569; cursor: pointer;">✏️ Edit</button>
                <button onclick="fireSuperstar('${f.id}')" style="background: #fee2e2; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: bold; color: #ef4444; cursor: pointer;">✕</button>
            </div>
        `;
        grid.appendChild(card);
    });

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

function renderRosterGridWithoutReload() {
    const grid = document.getElementById('rosterGrid');
    const countBadge = document.getElementById('rosterCount');
    if (!grid) return;

    const championships = JSON.parse(localStorage.getItem('wwe_titles')) || [];

    buildMasterRankingsPanel();

    grid.innerHTML = '';
    if (countBadge) countBadge.textContent = `${fighters.length} Superstars`;

    if (fighters.length === 0) {
        grid.innerHTML = `<div style="grid-column: span 4; background: white; border: 1px dashed #cbd5e1; padding: 40px; text-align: center; font-weight: bold; color: #64748b; border-radius: 12px;">Your locker room is empty. Use the roster form to add your very first wrestler!</div>`;
        return;
    }

    fighters.forEach(f => {
        const card = document.createElement('div');
        card.style.cssText = "background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; align-items: center; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: center;";
        card.id = `fighter-card-${f.id}`;
        
        let rate = (f.wins + f.losses) === 0 ? 0 : Math.round((f.wins / (f.wins + f.losses)) * 100);
        let genderColor = f.gender === 'male' ? '#0284c7' : '#db2777';

        let heldBelts = championships.filter(b => b.championId === f.id);
        let goldBadgesHtml = '';
        
        if (heldBelts.length > 0) {
            card.style.border = '2px solid #eab308';
            card.style.boxShadow = '0 4px 12px rgba(234, 179, 8, 0.15)';
            
            heldBelts.forEach(b => {
                goldBadgesHtml += `<div style="background: #fef9c3; border: 1px solid #fef08a; color: #a16207; font-size: 0.58rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-top: 4px; text-transform: uppercase; display: inline-block;">🏆 ${b.name.replace(' Championship', '')}</div>`;
            });
        }

        let totalDefenses = championships.filter(b => b.championId === f.id).reduce((sum, b) => sum + (b.defenses || 0), 0);
        let titleFightsCount = f.title_fights || 0;

        let avatarContent = '';
        if (f.photo) {
            avatarContent = `<img src="${f.photo}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; object-position: center center; display: block;" alt="${f.name}">`;
        } else {
            avatarContent = `<span style="font-size: 1.25rem; font-weight: bold;">${f.name.charAt(0)}</span>`;
        }

        card.innerHTML = `
            <div onclick="uploadFighterPhoto('${f.id}')" style="width: 44px; height: 44px; background: #f1f5f9; border: 2px solid ${genderColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: bold; color: ${genderColor}; margin-bottom: 8px; cursor: pointer; position: relative; overflow: hidden; transition: 0.2s;">${avatarContent}</div>
            <h4 class="fighter-name-target" style="margin: 0; font-size: 1rem; font-weight: 800; color: #0f172a;">${f.name}</h4>
            <span style="font-size: 0.65rem; font-weight: bold; color: #64748b; text-transform: uppercase; margin-top: 2px;">${f.division} • ${f.gender}</span>
            
            <div style="margin-top: 2px; display: flex; flex-direction: column; gap: 2px; align-items: center;">${goldBadgesHtml}</div>

            <div style="margin-top:8px; display:flex; flex-direction:column; align-items:center; width:100%; box-sizing:border-box;">
                <div style="display:flex; gap:8px; align-items:center;">
                    <span style="background:#052e17; color:#d1fae5; padding:4px 8px; border-radius:8px; font-weight:900; font-size:0.85rem;">${f.wins}W</span>
                    <span style="background:#3b0b0b; color:#fecaca; padding:4px 8px; border-radius:8px; font-weight:900; font-size:0.85rem;">${f.losses}L</span>
                    <span style="font-size:0.65rem; color:#94a3b8; font-weight:700; margin-left:6px;">${rate}%</span>
                </div>
                <div style="margin-top:6px; font-size:0.62rem; color:#64748b; font-weight:800; text-transform:uppercase; letter-spacing:0.02em; display:flex; gap:8px;">
                    <span>🛡️ Defenses: <strong style="color:#0f172a; margin-left:4px;">${totalDefenses}</strong></span>
                    <span>🏅 Belts: <strong style="color:#0f172a; margin-left:4px;">${heldBelts.length}</strong></span>
                    <span>🥊 Title Fights: <strong style="color:#0f172a; margin-left:4px;">${titleFightsCount}</strong></span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; width: 100%; border-top: 1px solid #f1f5f9; padding-top: 6px; font-size: 0.58rem; color: #64748b; gap: 2px;">
                <div><span style="color: #1e293b; display: block; font-weight: bold;">${f.win_pinfall || 0}</span>PINS</div>
                <div><span style="color: #1e293b; display: block; font-weight: bold;">${f.win_ko || 0}</span>KO</div>
                <div><span style="color: #1e293b; display: block; font-weight: bold;">${f.win_submission || 0}</span>SUB</div>
            </div>
            <div style="margin-top: 10px; display: flex; gap: 4px; width: 100%;">
                <button onclick="editSuperstar('${f.id}')" style="flex: 1; background: #f1f5f9; border: none; padding: 4px; border-radius: 4px; font-size: 0.65rem; font-weight: bold; color: #475569; cursor: pointer;">✏️ Edit</button>
                <button onclick="fireSuperstar('${f.id}')" style="background: #fee2e2; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: bold; color: #ef4444; cursor: pointer;">✕</button>
            </div>
        `;
        grid.appendChild(card);
    });

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

function buildMasterRankingsPanel() {
    const existingPanel = document.getElementById('rosterLeaderboardFilters');
    if (existingPanel) existingPanel.remove();

    const gridElement = document.getElementById('rosterGrid');
    if (!gridElement || !gridElement.parentNode) return;

    const championships = JSON.parse(localStorage.getItem('wwe_titles')) || [];
    const fightersCopy = [...fighters];

    const mostTitleFights = fightersCopy.reduce((best, fighter) => {
        const count = fighter.title_fights || 0;
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
        <button onclick="sortRosterByMetric('alphabetical')" style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #475569; cursor: pointer;">🔤 A-Z</button>
        <button onclick="sortRosterByMetric('wins')" style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #16a34a; cursor: pointer;">👑 Most Wins</button>
        <button onclick="sortRosterByMetric('losses')" style="background: #fff5f5; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #dc2626; cursor: pointer;">📉 Most Losses</button>
        <button onclick="sortRosterByMetric('win_pinfall')" style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #0284c7; cursor: pointer;">📌 Pinfall Leaders</button>
        <button onclick="sortRosterByMetric('win_ko')" style="background: #fff7ed; border: 1px solid #ffedd5; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #ea580c; cursor: pointer;">💥 KO Masters</button>
        <button onclick="sortRosterByMetric('win_submission')" style="background: #fbf7ff; border: 1px solid #f3e8ff; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #7c3aed; cursor: pointer;">🥋 Submission Experts</button>
        <button onclick="sortRosterByMetric('win_rate')" style="background: #ecfeff; border: 1px solid #cffafe; padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; color: #0284c7; cursor: pointer;">📈 Win Rate</button>
        <button onclick="sortRosterByMetric('title_fights')" style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 999px; font-size: 0.7rem; font-weight: bold; color: #0f172a; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">🏆 Most Title Fights</button>
        <button onclick="sortRosterByMetric('defenses')" style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 999px; font-size: 0.7rem; font-weight: bold; color: #0f172a; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">🛡️ Most Title Defenses</button>
        <button onclick="sortRosterByMetric('current_belts')" style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 999px; font-size: 0.7rem; font-weight: bold; color: #0f172a; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">🎖️ Most Current Belts</button>
    `;

    gridElement.parentNode.insertBefore(filterPanel, gridElement);
}

function setupSidebarFormEngine() {
    let addBtn = null;
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.toLowerCase().includes('add to roster')) addBtn = btn;
    });
    
    if (addBtn) {
        addBtn.removeAttribute('onclick');
        addBtn.onclick = function(e) {
            e.preventDefault();
            fighters = loadFighters();

            const nameInput = document.getElementById('fighterName') || document.querySelector('input[placeholder*="Roman"]') || document.querySelector('input[placeholder*="Superstar"]') || document.querySelector('input[type="text"]');
            const divisionInput = document.getElementById('fighterDivision') || document.querySelector('input[placeholder*="Heavyweight"]') || document.querySelector('input[placeholder*="Weight"]');
            const genderSelect = document.getElementById('fighterGender') || document.querySelector('select');

            const nameValue = nameInput ? nameInput.value.trim() : "";
            if (!nameValue) return alert("Please enter a Superstar name before signing their contract!");

            const newFighter = {
                id: 'f-' + Date.now(),
                name: nameValue,
                gender: genderSelect ? genderSelect.value.toLowerCase() : 'male',
                division: normalizeDivisionName((divisionInput && divisionInput.value.trim()) ? divisionInput.value.trim() : 'HeavyWeight'),
                wins: 0, losses: 0, defenses: 0, title_fights: 0, win_pinfall: 0, win_ko: 0, win_submission: 0
            };

            fighters.push(normalizeFighterRecord(newFighter));
            assignAutoDivision(fighters);
            saveFighters(fighters);
            refreshFighterNameDatalist();
            
            if (nameInput) nameInput.value = '';
            if (divisionInput) divisionInput.value = '';
            
            alert(`Contract Signed! "${newFighter.name}" has officially been added back to your Universe roster!`);
            renderRosterGrid();
        };
    }
}

function setupLiveSearchEngine() {
    const searchBar = document.querySelector('input[placeholder*="Search"]') || document.querySelector('input[id*="Search"]') || document.querySelector('input[type="text"]:nth-of-type(2)');
    if (!searchBar) return;

    searchBar.id = 'rosterSearchInput';
    searchBar.onkeyup = filterRosterCards;
}

window.filterRosterCards = function() {
    const query = document.getElementById('rosterSearchInput')?.value.toLowerCase() || '';
    document.querySelectorAll('#rosterGrid > div').forEach(card => {
        const nameEl = card.querySelector('.fighter-name-target');
        if (nameEl) {
            const nameText = nameEl.textContent.toLowerCase();
            card.style.display = nameText.includes(query) ? 'flex' : 'none';
        }
    });
};

window.toggleBulkImporter = function() {
    const wrapper = document.getElementById('bulkImporterWrapper');
    if (!wrapper) return;
    wrapper.style.display = wrapper.style.display === 'none' ? 'block' : 'none';
};

window.importBulkSuperstars = function() {
    fighters = loadFighters();
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
    renderRosterGrid();
    textarea.value = '';
    alert(`${added} ${added === 1 ? 'superstar' : 'superstars'} imported successfully.`);
};

window.syncWWE2K24Roster = function() {
    fighters = loadFighters();
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
        renderRosterGrid();
    }

    alert(`WWE 2K24 sync complete. Added ${added} new fighter${added === 1 ? '' : 's'} and updated ${updated} existing fighter${updated === 1 ? '' : 's'}.`);
};

window.editSuperstar = function(id) {
    const card = document.getElementById(`fighter-card-${id}`);
    const f = fighters.find(fighter => fighter.id === id);
    if (!card || !f) return;

    const oldPanel = document.getElementById(`inline-editor-${id}`);
    if (oldPanel) oldPanel.remove();

    if (f.title_fights === undefined) f.title_fights = 0;

    const editPanel = document.createElement('div');
    editPanel.id = `inline-editor-${id}`;
    editPanel.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #0f172a; border-radius: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 10px; box-sizing: border-box; z-index: 100; border: 2px solid #eab308; align-content: center;";

    editPanel.innerHTML = `
        <span style="grid-column: span 2; font-size: 0.68rem; font-weight: 800; color: #eab308; text-transform: uppercase; margin-bottom: 2px;">✏️ Adjust ${f.name}</span>
        <div style="display: flex; flex-direction: column; width: 100%; gap: 1px;">
            <label style="font-size: 0.5rem; font-weight: bold; color: #94a3b8; text-align: left;">Fighter Name:</label>
            <input type="text" id="edit-name-${id}" value="${f.name}" style="width: 100%; padding: 2px 4px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white; font-weight: bold; font-size: 0.65rem;">
        </div>
        <div style="display: flex; flex-direction: column; width: 100%; gap: 1px;">
            <label style="font-size: 0.5rem; font-weight: bold; color: #94a3b8; text-align: left;">Gender:</label>
            <select id="edit-gender-${id}" style="width: 100%; padding: 2px 4px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white; font-weight: bold; font-size: 0.65rem;">
                <option value="male">Male</option>
                <option value="female">Female</option>
            </select>
        </div>
        <div style="display: flex; flex-direction: column; width: 100%; gap: 1px;">
            <label style="font-size: 0.5rem; font-weight: bold; color: #94a3b8; text-align: left;">Weight Class:</label>
            <select id="edit-division-${id}" style="width: 100%; padding: 2px 4px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white; font-weight: bold; font-size: 0.65rem;">
                <option value="Cruiser Weight">Cruiser Weight</option>
                <option value="Light HeavyWeight">Light HeavyWeight</option>
                <option value="HeavyWeight">HeavyWeight</option>
                <option value="Super HeavyWeight">Super HeavyWeight</option>
            </select>
        </div>
        <div style="display: flex; flex-direction: column; width: 100%; gap: 1px;">
            <label style="font-size: 0.5rem; font-weight: bold; color: #94a3b8; text-align: left;">Wins:</label>
            <input type="number" id="edit-wins-${id}" value="${f.wins}" style="width: 100%; padding: 2px 4px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white; font-weight: bold; font-size: 0.65rem;">
        </div>
        <div style="display: flex; flex-direction: column; width: 100%; gap: 1px;">
            <label style="font-size: 0.5rem; font-weight: bold; color: #94a3b8; text-align: left;">Losses:</label>
            <input type="number" id="edit-losses-${id}" value="${f.losses}" style="width: 100%; padding: 2px 4px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white; font-weight: bold; font-size: 0.65rem;">
        </div>
        <div style="display: flex; flex-direction: column; width: 100%; gap: 1px;">
            <label style="font-size: 0.5rem; font-weight: bold; color: #94a3b8; text-align: left;">Pin victories:</label>
            <input type="number" id="edit-pins-${id}" value="${f.win_pinfall || 0}" style="width: 100%; padding: 2px 4px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white; font-weight: bold; font-size: 0.65rem;">
        </div>
        <div style="display: flex; flex-direction: column; width: 100%; gap: 1px;">
            <label style="font-size: 0.5rem; font-weight: bold; color: #94a3b8; text-align: left;">KO victories:</label>
            <input type="number" id="edit-kos-${id}" value="${f.win_ko || 0}" style="width: 100%; padding: 2px 4px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white; font-weight: bold; font-size: 0.65rem;">
        </div>
        <div style="display: flex; flex-direction: column; width: 100%; gap: 1px;">
            <label style="font-size: 0.5rem; font-weight: bold; color: #94a3b8; text-align: left;">Sub victories:</label>
            <input type="number" id="edit-subs-${id}" value="${f.win_submission || 0}" style="width: 100%; padding: 2px 4px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white; font-weight: bold; font-size: 0.65rem;">
        </div>
        <div style="display: flex; flex-direction: column; width: 100%; gap: 1px;">
            <label style="font-size: 0.5rem; font-weight: bold; color: #94a3b8; text-align: left;">Title Fights:</label>
            <input type="number" id="edit-fights-${id}" value="${f.title_fights}" style="width: 100%; padding: 2px 4px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white; font-weight: bold; font-size: 0.65rem;">
        </div>
        <div style="grid-column: span 2; display: flex; gap: 4px; width: 100%; margin-top: 4px;">
            <button onclick="saveInlineEdit('${id}')" style="flex: 1; background: #10b981; border: none; color: white; font-weight: bold; padding: 4px; border-radius: 4px; font-size: 0.65rem; cursor: pointer;">Save Changes</button>
            <button onclick="deleteFighterPhoto('${id}', true)" style="flex: 1; background: #f97316; border: none; color: white; font-weight: bold; padding: 4px; border-radius: 4px; font-size: 0.65rem; cursor: pointer;">🗑️ Delete Photo</button>
            <button onclick="document.getElementById('inline-editor-${id}').remove()" style="background: #475569; border: none; color: white; font-weight: bold; padding: 4px; border-radius: 4px; font-size: 0.65rem; cursor: pointer;">Cancel</button>
        </div>
    `;
    card.appendChild(editPanel);
    // Keep roster search focused on this fighter so it stays visible while editing
    try {
        const rosterSearch = document.getElementById('rosterSearchInput');
        if (rosterSearch) {
            rosterSearch.value = f.name;
            filterRosterCards();
        }
        const nameEl = document.getElementById(`edit-name-${id}`);
        if (nameEl) nameEl.focus();
    } catch (e) { console.warn('Could not focus roster search or edit name', e); }
    // Ensure input values are set programmatically to avoid HTML attribute parsing issues
    try {
        const nameEl = document.getElementById(`edit-name-${id}`);
        const genderEl = document.getElementById(`edit-gender-${id}`);
        const divEl = document.getElementById(`edit-division-${id}`);
        const winsEl = document.getElementById(`edit-wins-${id}`);
        const lossesEl = document.getElementById(`edit-losses-${id}`);
        const pinsEl = document.getElementById(`edit-pins-${id}`);
        const kosEl = document.getElementById(`edit-kos-${id}`);
        const subsEl = document.getElementById(`edit-subs-${id}`);
        const fightsEl = document.getElementById(`edit-fights-${id}`);
        if (nameEl) nameEl.value = f.name || '';
        if (genderEl) {
            genderEl.value = (f.gender || 'male').toString().toLowerCase();
        }
        if (divEl) {
            const currentDivision = normalizeDivisionName(f.division || 'HeavyWeight');
            const optionExists = Array.from(divEl.options).some(option => option.value === currentDivision);
            if (optionExists) {
                divEl.value = currentDivision;
            } else {
                const customOption = document.createElement('option');
                customOption.value = currentDivision;
                customOption.textContent = currentDivision;
                customOption.selected = true;
                divEl.prepend(customOption);
            }
        }
        if (winsEl) winsEl.value = f.wins || 0;
        if (lossesEl) lossesEl.value = f.losses || 0;
        if (pinsEl) pinsEl.value = f.win_pinfall || 0;
        if (kosEl) kosEl.value = f.win_ko || 0;
        if (subsEl) subsEl.value = f.win_submission || 0;
        if (fightsEl) fightsEl.value = f.title_fights || 0;
    } catch (err) {
        console.error('failed to set inline editor values', err);
    }
};

window.saveInlineEdit = function(id) {
    const f = fighters.find(fighter => fighter.id === id);
    if (!f) return;

    const nameInput = document.getElementById(`edit-name-${id}`);
    const genderInput = document.getElementById(`edit-gender-${id}`);
    const divisionInput = document.getElementById(`edit-division-${id}`);
    const winsInput = document.getElementById(`edit-wins-${id}`);
    const lossesInput = document.getElementById(`edit-losses-${id}`);
    const pinsInput = document.getElementById(`edit-pins-${id}`);
    const kosInput = document.getElementById(`edit-kos-${id}`);
    const subsInput = document.getElementById(`edit-subs-${id}`);
    const fightsInput = document.getElementById(`edit-fights-${id}`);

    if (nameInput && genderInput && divisionInput && winsInput && lossesInput && pinsInput && kosInput && subsInput && fightsInput) {
        const newName = nameInput.value.trim();
        const newGender = (genderInput.value || 'male').toString().toLowerCase();
        const newDivision = divisionInput.value.trim() || 'Heavyweight';
        const newWins = parseInt(winsInput.value) || 0;
        const newLosses = parseInt(lossesInput.value) || 0;
        const newPinfalls = parseInt(pinsInput.value) || 0;
        const newKOs = parseInt(kosInput.value) || 0;
        const newSubs = parseInt(subsInput.value) || 0;
        const newTitleFights = parseInt(fightsInput.value) || 0;

        if (!newName) {
            return alert('Fighter name cannot be empty.');
        }

        const statsChanged = (
            newWins !== f.wins ||
            newLosses !== f.losses ||
            newPinfalls !== (f.win_pinfall || 0) ||
            newKOs !== (f.win_ko || 0) ||
            newSubs !== (f.win_submission || 0) ||
            newTitleFights !== (f.title_fights || 0)
        );
        const identityChanged = (newName !== f.name || newDivision !== f.division || newGender !== f.gender);

        f.name = newName;
        f.gender = newGender;
        f.division = newDivision;
        f.wins = newWins;
        f.losses = newLosses;
        f.win_pinfall = newPinfalls;
        f.win_ko = newKOs;
        f.win_submission = newSubs;
        f.title_fights = newTitleFights;

        if (statsChanged) {
            f.compiled_history_deck = [];
            f.history_deck = [];
            f.history = [];
        }

        localStorage.setItem('wwe_fighters', JSON.stringify(fighters));
            renderRosterGrid();
            refreshFighterNameDatalist();
    }
};

window.sortRosterByMetric = function(metricType) {
    if (!fighters || fighters.length === 0) return;

    if (metricType === 'alphabetical') {
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
    } else {
        fighters.sort((a, b) => (b[metricType] || 0) - (a[metricType] || 0));
    }
    renderRosterGridWithoutReload();
};

window.fireSuperstar = function(id) {
    if (confirm("Release this competitor from their contract? This will remove them completely from your Universe roster!")) {
        fighters = fighters.filter(f => f.id !== id);
        localStorage.setItem('wwe_fighters', JSON.stringify(fighters));
        renderRosterGrid();
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

window.saveCroppedPhoto = function(fighterId, isRoster) {
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
    const performSave = () => {
        const scale = zoom / 100;
        const scaledWidth = srcImage.naturalWidth * scale;
        const scaledHeight = srcImage.naturalHeight * scale;
        const x = canvas.width / 2 - scaledWidth / 2 + offsetX;
        const y = canvas.height / 2 - scaledHeight / 2 + offsetY;
        ctx.drawImage(srcImage, x, y, scaledWidth, scaledHeight);

        const croppedPhoto = canvas.toDataURL('image/jpeg');
        const fighter = fighters.find(f => f.id === fighterId);
        if (fighter) {
            fighter.photo = croppedPhoto;
            localStorage.setItem('wwe_fighters', JSON.stringify(fighters));
            // preserve roster search and selection so grid doesn't jump/reset
            const rosterSearch = document.getElementById('rosterSearchInput');
            const searchQuery = rosterSearch ? rosterSearch.value : '';
            const hadFocus = document.activeElement === rosterSearch;
            if (isRoster) {
                renderRosterGrid();
                // restore search query and reapply filter
                const rs = document.getElementById('rosterSearchInput');
                if (rs) {
                    rs.value = searchQuery;
                    filterRosterCards();
                    if (hadFocus) rs.focus();
                }
                // try to keep the edited fighter visible
                setTimeout(() => {
                    const el = document.getElementById(`fighter-card-${fighterId}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 150);
            }
        }
        document.getElementById('photoCropDialog').remove();
    };

    if (srcImage && srcImage.naturalWidth) {
        performSave();
    } else {
        srcImage.crossOrigin = 'anonymous';
        srcImage.src = document.getElementById('cropImagePreview').src;
        srcImage.onload = performSave;
    }
};

window.deleteFighterPhoto = function(fighterId, isRoster) {
    const fighter = fighters.find(f => f.id === fighterId);
    if (!fighter) return;
    if (!confirm(`Delete ${fighter.name}'s photo? This cannot be undone.`)) return;
    delete fighter.photo;
    localStorage.setItem('wwe_fighters', JSON.stringify(fighters));
    if (document.getElementById('photoCropDialog')) document.getElementById('photoCropDialog').remove();
    if (isRoster) {
        renderRosterGrid();
    }
};

