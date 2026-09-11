export const componentRegistry = {
  AutoOrderPanel: () => import('./AutoOrder'),
  ChannelPack: () => import('../features/learning/ChannelPack'),
}

export type RegistryName = keyof typeof componentRegistry
