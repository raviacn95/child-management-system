export const BRAIN_CATEGORIES = [
  'world',
  'space',
  'animals',
  'science',
  'nature',
  'inventions',
  'vocabulary',
  'logic',
  'creativity',
  'emotional',
] as const

export type BrainCategory = (typeof BRAIN_CATEGORIES)[number]

export interface BrainCard {
  id: string
  category: BrainCategory
  title: string
  normal: string
  simple: string
  superSimple: string
  why: [string, string]
}

const CATEGORY_LABEL: Record<BrainCategory, string> = {
  world: 'World',
  space: 'Space',
  animals: 'Animals',
  science: 'Science',
  nature: 'Nature',
  inventions: 'Inventions',
  vocabulary: 'Vocabulary',
  logic: 'Logic',
  creativity: 'Creativity',
  emotional: 'Feelings',
}

export function categoryLabel(category: BrainCategory) {
  return CATEGORY_LABEL[category]
}

function card(
  id: string,
  category: BrainCategory,
  title: string,
  normal: string,
  simple: string,
  superSimple: string,
  why: [string, string],
): BrainCard {
  return { id, category, title, normal, simple, superSimple, why }
}

export const BRAIN_CARDS: BrainCard[] = [
  card('world-train', 'world', 'On-time trains', 'Japan’s bullet trains are planned to arrive very close to the scheduled minute.', 'Fast trains in Japan try to arrive right on time.', 'Some trains try to be on time.', ['A timetable tells the train when to arrive.', 'Careful tracks and clocks help the train keep that plan.']),
  card('world-river', 'world', 'A long river', 'The Nile is one of the longest rivers people have measured.', 'One river in Africa is very, very long.', 'A river can be longer than a road.', ['A river is water moving downhill.', 'Long rivers can cross many towns.']),
  card('world-midnight', 'world', 'Midnight sun', 'In northern Norway, summer days can keep the sun in the sky at midnight.', 'In some places the sun stays up very late in summer.', 'Sometimes the sun stays up at bedtime.', ['Earth is tilted as it travels around the sun.', 'That tilt gives some places long summer days.']),
  card('world-marble', 'world', 'White marble', 'The Taj Mahal in India is a famous building made mostly of white marble.', 'A famous building in India is made of white stone.', 'A building can be made of white stone.', ['Marble is rock that people can polish.', 'Builders carried the stone to the site.']),
  card('world-wall', 'world', 'A long wall', 'The Great Wall of China crosses hills and mountains for a very long way.', 'China has a wall that goes over hills.', 'A wall can be longer than a street.', ['People built it in parts over many years.', 'Hills made each part a hard walk.']),
  card('space-earth', 'space', 'Planet Earth', 'Earth is our home planet. It has air, water, and a rocky ground.', 'We live on a planet called Earth.', 'Earth is our home.', ['A planet travels around a star.', 'Our star is the sun.']),
  card('space-moon', 'space', 'The Moon', 'The Moon looks bright because it reflects light from the sun.', 'The Moon shines with light from the sun.', 'The Moon borrows sunlight.', ['The Moon does not make its own light.', 'Sunlight bounces off it to our eyes.']),
  card('space-jupiter', 'space', 'Huge Jupiter', 'Jupiter is so large that more than 1,000 Earths could fit inside it.', 'Jupiter is big enough to hold many Earths.', 'Jupiter is a giant planet.', ['Jupiter is made mostly of gas.', 'Its size is why so many Earths could fit.']),
  card('space-satellites', 'space', 'Satellites', 'Satellites circle Earth and help maps, weather pictures, and phone calls.', 'Machines circle Earth to help maps and weather.', 'Some machines fly around Earth.', ['A rocket carries a satellite up.', 'It keeps falling around Earth instead of down to the ground.']),
  card('space-travel', 'space', 'Space travel', 'People ride rockets to visit the space station above Earth.', 'A rocket can carry people above the sky.', 'Rockets go up very high.', ['Rockets push hot gas downward.', 'That push lifts them up.']),
  card('animals-octopus', 'animals', 'Three hearts', 'Octopuses have three hearts, and their blood is blue.', 'An octopus has three hearts and blue blood.', 'An octopus has blue blood.', ['Blue blood uses copper to carry oxygen.', 'Two hearts send blood to the gills.']),
  card('animals-whale', 'animals', 'Largest animal', 'The blue whale is the largest animal known on Earth.', 'The blue whale is the biggest animal.', 'A whale can be huge.', ['It lives in the ocean.', 'It eats tiny animals called krill.']),
  card('animals-bees', 'animals', 'Bee dance', 'Honeybees dance to tell other bees where flowers are.', 'Bees dance to share where flowers are.', 'Bees can dance a message.', ['The dance shows direction and distance.', 'Other bees watch and then fly there.']),
  card('animals-chameleon', 'animals', 'Color change', 'A chameleon can change color as its mood, light, or temperature changes.', 'Some lizards change color.', 'A lizard can change color.', ['Special skin cells shift the color.', 'Color can also send a message to other lizards.']),
  card('animals-penguins', 'animals', 'Penguin huddle', 'Emperor penguins huddle so the group stays warmer in the cold.', 'Penguins stand close together to stay warm.', 'Penguins share warmth.', ['The middle of the huddle is warmer.', 'They take turns moving so everyone gets a turn inside.']),
  card('science-lightning', 'science', 'Hot lightning', 'Lightning is hotter than the surface of the Sun.', 'A lightning bolt is hotter than the Sun’s surface.', 'Lightning is very hot.', ['A bolt is a fast rush of electricity.', 'That rush heats the air in a flash.']),
  card('science-gravity', 'science', 'Gravity', 'Gravity pulls objects toward Earth, which is why dropped toys fall.', 'Gravity pulls things down.', 'Dropped toys fall.', ['Every object pulls on other objects.', 'Earth is so big that its pull is the one we feel.']),
  card('science-water', 'science', 'Three forms', 'Water can be ice, liquid, or steam when it gains or loses heat.', 'Water can be ice, a drink, or steam.', 'Water can change.', ['Heat makes the tiny parts move faster.', 'Cooling slows them until they lock as ice.']),
  card('science-magnet', 'science', 'Magnets', 'A magnet pulls on some metals, such as iron, but not on wood.', 'Magnets stick to some metal.', 'A magnet can pull metal.', ['Tiny parts in the metal line up.', 'Wood does not line up that way.']),
  card('science-sound', 'science', 'Sound and light', 'You see lightning before you hear thunder because light travels faster than sound.', 'Light arrives before sound.', 'You see the flash first.', ['Light races to your eyes.', 'Sound walks through air more slowly.']),
  card('nature-bamboo', 'nature', 'Fast bamboo', 'Bamboo can grow faster than many other plants.', 'Bamboo can grow very fast.', 'Some plants grow fast.', ['Bamboo is a kind of grass.', 'Warm rain helps the stalk shoot upward.']),
  card('nature-rainbow', 'nature', 'Rainbow', 'A rainbow can appear when sunlight passes through raindrops.', 'Sunlight and rain can make a rainbow.', 'Rain and sun can make colors.', ['Each drop bends the light.', 'Different colors bend a little differently.']),
  card('nature-trees', 'nature', 'Tree air', 'Trees take in carbon dioxide and give off oxygen that people breathe.', 'Trees help make air we breathe.', 'Trees help our air.', ['Leaves use sunlight to make food.', 'Oxygen is released during that work.']),
  card('nature-seeds', 'nature', 'Traveling seeds', 'Some seeds ride the wind, and some stick to animal fur.', 'Seeds can travel on wind or fur.', 'Seeds can move.', ['A ride spreads plants to new soil.', 'Dandelion fluff is a wind ride.']),
  card('nature-coral', 'nature', 'Coral', 'A coral reef is built slowly by many tiny animals.', 'Tiny animals build a coral reef.', 'Tiny animals can build a home.', ['Each coral animal makes a hard cup.', 'Many cups together become a reef.']),
  card('inventions-velcro', 'inventions', 'Velcro', 'Velcro was inspired by burrs sticking to clothing.', 'Sticky plant burrs gave people the idea for Velcro.', 'Burrs stuck, so someone made a fastener.', ['Burrs have tiny hooks.', 'Velcro copies hooks and loops.']),
  card('inventions-wheel', 'inventions', 'The wheel', 'The wheel made it easier to move heavy things.', 'Wheels help move heavy things.', 'Wheels roll.', ['Rolling needs less dragging.', 'Carts use that idea.']),
  card('inventions-glasses', 'inventions', 'Glasses', 'Glasses bend light so some people can see more clearly.', 'Glasses help some people see.', 'Glasses help eyes.', ['The lenses bend light.', 'The bend can make a picture sharper.']),
  card('inventions-press', 'inventions', 'Printed books', 'The printing press let many copies of a book be made faster.', 'A press can make many copies of a book.', 'Books can be copied.', ['Movable letters get inked.', 'Paper is pressed onto them.']),
  card('inventions-zipper', 'inventions', 'Zippers', 'A zipper closes a coat by locking two rows of teeth together.', 'A zipper pulls a coat closed.', 'A zipper shuts a coat.', ['The slider pushes the teeth together.', 'Pulling it back lets them open.']),
  card('vocabulary-curious', 'vocabulary', 'Curious', 'Curious means wanting to learn more.', 'Curious means you want to know more.', 'Curious means you want to learn.', ['A question is a curious act.', 'Looking closely is curious too.']),
  card('vocabulary-brave', 'vocabulary', 'Brave', 'Brave means doing something careful even when you feel scared.', 'Brave means trying even when you feel scared.', 'Brave can mean you try.', ['Fear can still be there.', 'Brave is the choice to act with care.']),
  card('vocabulary-patient', 'vocabulary', 'Patient', 'Patient means waiting calmly.', 'Patient means you can wait.', 'Patient means wait.', ['Waiting is a skill.', 'A calm body makes waiting easier.']),
  card('vocabulary-kind', 'vocabulary', 'Kind', 'Kind means helping in a way that is gentle.', 'Kind means you help gently.', 'Kind means you help.', ['A kind act can be small.', 'Sharing and listening are kind.']),
  card('vocabulary-observe', 'vocabulary', 'Observe', 'Observe means looking carefully to notice details.', 'Observe means you look carefully.', 'Observe means look closely.', ['Details are small clues.', 'Scientists observe before they decide.']),
  card('logic-weight', 'logic', 'Same weight', 'One kilogram of cotton and one kilogram of iron weigh the same. The cotton takes up more space.', 'A kilogram of cotton and a kilogram of iron weigh the same.', 'Same kilograms weigh the same.', ['Kilogram names the weight, not the size.', 'Cotton is fluffier, so it looks bigger.']),
  card('logic-count', 'logic', 'Next number', 'In 2, 4, 6, the next number is 8 because each step adds 2.', '2, 4, 6… next is 8.', 'Count by twos.', ['Each step is the same size.', 'Add 2 again to get 8.']),
  card('logic-square', 'logic', 'Square sides', 'A square has four sides, and each side is the same length.', 'A square has four equal sides.', 'A square has four sides.', ['Equal means the same length.', 'The corners are also equal.']),
  card('logic-dogs', 'logic', 'All and some', 'If all dogs are animals, then one dog is an animal too.', 'If every dog is an animal, this dog is an animal.', 'A dog is an animal.', ['All means every one.', 'One dog is inside that group.']),
  card('logic-cups', 'logic', 'Which cup', 'A wide cup and a tall cup might hold different amounts. You measure to know.', 'You measure to see which cup holds more.', 'Measure the cups.', ['Looks can fool you.', 'A measuring cup gives the amount.']),
  card('creativity-animal', 'creativity', 'New animal', 'Can you invent a new animal using two animals you know?', 'Mix two animals into a new one.', 'Mix two animals.', ['Pick one part from each animal.', 'Give the new animal a name.']),
  card('creativity-house', 'creativity', 'Floating house', 'Can you draw a house that could float?', 'Draw a house that floats.', 'Draw a floating house.', ['Decide what holds it up.', 'A balloon, a boat, or a cloud could do it.']),
  card('creativity-color', 'creativity', 'New color', 'Can you name a color that does not exist yet?', 'Invent a name for a new color.', 'Name a new color.', ['Mix two colors you know.', 'The name can be playful.']),
  card('creativity-robot', 'creativity', 'Lunch robot', 'What would a friendly robot say at lunch?', 'Give a kind robot a lunch line.', 'What would a robot say?', ['A friendly line is polite.', 'It might ask someone to share.']),
  card('creativity-story', 'creativity', 'Three words', 'Can you tell a story in only three words?', 'Tell a story with three words.', 'Use three words.', ['Each word should do a job.', 'A start, a middle, and an end can fit.']),
  card('emotional-sad', 'emotional', 'A sad friend', 'You could say, “I am here. Do you want to talk, or sit quietly?”', 'You can say, “I am here.”', 'You can sit with a sad friend.', ['Asking gives them a choice.', 'Quiet company can help too.']),
  card('emotional-angry', 'emotional', 'A hot feeling', 'When you feel angry, pause, breathe, and then use words.', 'Pause and breathe before you speak.', 'Breathe, then use words.', ['A pause lets your body settle.', 'Words are safer than hitting.']),
  card('emotional-thanks', 'emotional', 'Thank you', 'When someone shares, “thank you” tells them you noticed.', 'Say thank you when someone shares.', 'Say thank you.', ['Thanks names the kind act.', 'People like to know it helped.']),
  card('emotional-proud', 'emotional', 'Feeling proud', 'When you feel proud, you can tell someone what you tried.', 'Tell someone what you tried.', 'Share what you tried.', ['Proud can be about effort.', 'Trying counts even if it was hard.']),
  card('emotional-invite', 'emotional', 'Left out', 'If a friend is left out, you can invite them in.', 'Invite a left-out friend to join.', 'Ask a friend to join.', ['An invitation is a kind door.', 'They can still say no.']),
]

export const GENIUS_PATH = ['space-earth', 'space-moon', 'science-gravity', 'space-satellites', 'space-travel'] as const
