export type StaticVoiceAudio = {
  feminino: string;
  masculino: string;
};

export type StaticGuidanceAudio = {
  preparation: StaticVoiceAudio;
  closing: StaticVoiceAudio;
};

export function normalizeNarrationSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function buildRoutineStaticAudioAssets(collection: string, routineId: string) {
  const slug = normalizeNarrationSlug(routineId);
  const basePath = `/meditations/${collection}`;

  return {
    audio: {
      feminino: `${basePath}/${slug}-feminino.mp3`,
      masculino: `${basePath}/${slug}-masculino.mp3`,
    },
    guidedAudio: {
      preparation: {
        feminino: `${basePath}/${slug}-intro-feminino.mp3`,
        masculino: `${basePath}/${slug}-intro-masculino.mp3`,
      },
      closing: {
        feminino: `${basePath}/${slug}-closing-feminino.mp3`,
        masculino: `${basePath}/${slug}-closing-masculino.mp3`,
      },
    },
  } satisfies {
    audio: StaticVoiceAudio;
    guidedAudio: StaticGuidanceAudio;
  };
}
