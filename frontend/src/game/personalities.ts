import type { AgentPersonality } from '../types/simulation';

export const AGENT_PERSONALITIES: Record<string, AgentPersonality> = {
  alex: {
    id: 'alex',
    name: 'Alex',
    occupation: 'Farmer',
    avatar: '👨‍🌾',
    color: '#38a169', // Green
    personality: 'Helpful, hardworking, optimistic. Takes pride in growing wholesome food for the community.',
    goals: 'Maintain the farm, care for the cows, and grow enough wheat to supply Mia and the village.',
    conflict: 'Dislikes wasting hard-earned food or seeing farm equipment neglected.',
    homeLocation: 'alex_farm',
    workLocation: 'wheat_field',
  },
  mia: {
    id: 'mia',
    name: 'Mia',
    occupation: 'Baker',
    avatar: '👩‍🍳',
    color: '#d69e2e', // Amber / Gold
    personality: 'Friendly, curious, talkative. Loves hearing the latest village stories and making fresh bread.',
    goals: 'Bake delicious pastries, build warm friendships with everyone, and keep village spirits high.',
    conflict: 'Gets offended when ignored or when promises are broken.',
    homeLocation: 'mia_bakery',
    workLocation: 'mia_bakery',
  },
  noah: {
    id: 'noah',
    name: 'Noah',
    occupation: 'Merchant',
    avatar: '🧔‍♂️',
    color: '#3182ce', // Blue
    personality: 'Strategic, cautious, slightly opportunistic. Always calculates profit and supply margins.',
    goals: 'Accumulate valuable goods, maintain a thriving shop inventory, and secure favorable trades.',
    conflict: 'Hesitates to share surplus resources without fair trade value in return.',
    homeLocation: 'noah_shop',
    workLocation: 'noah_shop',
  },
  emma: {
    id: 'emma',
    name: 'Emma',
    occupation: 'Village Healer',
    avatar: '👩‍⚕️',
    color: '#e53e3e', // Red / Rose
    personality: 'Empathetic, patient, observant. Attentive to others’ emotional and physical well-being.',
    goals: 'Gather soothing herbs, tend to sick villagers, and resolve interpersonal arguments calmly.',
    conflict: 'Often exhausts her own energy caring for others before attending to herself.',
    homeLocation: 'emma_healer',
    workLocation: 'emma_healer',
  },
  leo: {
    id: 'leo',
    name: 'Leo',
    occupation: 'Carpenter',
    avatar: '👷‍♂️',
    color: '#805ad5', // Purple
    personality: 'Creative, introverted, practical. Speaks little, prefers the rhythmic sound of sawing wood.',
    goals: 'Craft sturdy furniture, repair village structures, and build a new bridge across the stream.',
    conflict: 'Prefers working alone in quiet focus; becomes irritable when constantly interrupted.',
    homeLocation: 'leo_workshop',
    workLocation: 'leo_workshop',
  },
};
