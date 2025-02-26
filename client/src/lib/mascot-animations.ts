export interface MascotAnimation {
  transform: string;
  duration: number;
}

export const mascotAnimations = {
  idle: {
    transform: 'translateY(0px)',
    duration: 2000,
  },
  wave: {
    transform: 'translateY(-10px)',
    duration: 1000,
  },
  point: {
    transform: 'translateX(10px)',
    duration: 1500,
  },
};

export const tutorialSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Plant Care!',
    message: 'Hi! I\'m your plant buddy mascot. I\'ll help you learn about caring for your plants!',
    animation: 'wave',
  },
  {
    id: 'watering',
    title: 'Watering Tips',
    message: 'Let me show you how to properly water your plants.',
    animation: 'point',
  },
  {
    id: 'sunlight',
    title: 'Sunlight Requirements',
    message: 'Different plants need different amounts of light. Let\'s learn about placement!',
    animation: 'point',
  },
  {
    id: 'identify',
    title: 'Plant Identification',
    message: 'You can use your camera to identify plants! Let\'s try it out.',
    animation: 'point',
  },
];