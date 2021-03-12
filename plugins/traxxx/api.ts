import { AxiosResponse, AxiosInstance, AxiosError } from "axios";
import { Context } from "../../types/plugin";

export namespace EntityResult {
  export interface Entity {
    id: number;
    name: string;
    url: string;
    description: string | null;
    slug: string;
    type: string;
    independent: boolean;
    aliases: string[] | null;
    logo: string;
    thumbnail: string;
    favicon: string;
    parent: Entity | null;
    children: Entity[] | null;
    tags: string[] | null;
  }

  export interface Result {
    // Entity always exists for successful http requests
    // ex: null when 404
    entity: Entity;
  }
}

export namespace ActorResult {
  export interface Actor {
    id: number;
    name: string;
    gender?: string;
    aliasFor?: string;
    dateOfBirth?: string;
    birthCountry?: string;
    placeOfBirth?: { country: { name: string; alias: string } }, 
    alias?: string[];
    dateOfDeath?: string;
    cup?: string;
    bust?: number;
    waist?: number;
    hip?: number;
    naturalBoobs?: boolean;
    height?: number;
    weight?: number;
    eyes?: string;
    hairColor?: string;
    hasTattoos?: boolean;
    hasPiercings?: boolean;
    tattoos?: string;
    piercings?: string;
    ethnicity?: string;
    age?: number;
    avatar?: { id: string; path?: string };
  }

  export interface Result {
    // Entity always exists for successful http requests
    // ex: null when 404
    actor: Actor;
    actors: Actor[];
  }
}

export namespace SceneResult {
  export interface Scene {
    relevance: number;
    id: number;
    entryId: string;
    shootId: string;
    title: string;
    url: string;
    date: string;
    description: string | null;
    entity: EntityResult.Entity;
    actors: ActorResult.Actor[];
    tags: [{ name: string }];
    poster: { path: string };
  }

  export interface Result {
    // Entity always exists for successful http requests
    // ex: null when 404
    scene: Scene;
    scenes: Scene[];
  }
}

export class Api {
  ctx: Context;
  axios: AxiosInstance;

  constructor(ctx: Context) {
    this.ctx = ctx;
    this.axios = ctx.$axios.create({
      baseURL: "https://traxxx.me/api",
    });
  }

  /**
   * @param idOrSlug - the id or slug of the channel
   */
  public async getChannel(idOrSlug: string | number): Promise<AxiosResponse<EntityResult.Result>> {
    return this.axios.get<EntityResult.Result>(`/channels/${idOrSlug}`);
  }

  /**
   * @param idOrSlug - the id or slug of the network
   */
  public async getNetwork(idOrSlug: string | number): Promise<AxiosResponse<EntityResult.Result>> {
    return this.axios.get<EntityResult.Result>(`/networks/${idOrSlug}`);
  }

  /**
   * @param query - query to find the scene
   */
  public async getActors(query: string): Promise<AxiosResponse<ActorResult.Result>> {
    return this.axios.get<ActorResult.Result>(`/actors?limit=3&q=${query}`);
  }

  /**
   * @param id - the id of the scene
   */
  public async getActor(idOrSlug: string | number): Promise<AxiosResponse<ActorResult.Result>> {
    return this.axios.get<ActorResult.Result>(`/actors/${idOrSlug}`);
  }

  /**
   * @param query - query to find the scene
   */
  public async getScenes(query: string): Promise<AxiosResponse<SceneResult.Result>> {
    return this.axios.get<SceneResult.Result>(`/scenes?limit=2&q=${query}`);
  }

  /**
   * @param id - the id of the scene
   */
  public async getScene(id: number): Promise<AxiosResponse<SceneResult.Result>> {
    return this.axios.get<SceneResult.Result>(`/scenes/${id}`);
  }

  /**
   * Gets the channel and/or network for the slug
   *
   * @param idOrSlug - the id or slug of the channel/network
   */
  public async getAllEntities(
    idOrSlug: string | number
  ): Promise<{
    channel: EntityResult.Entity | undefined;
    network: EntityResult.Entity | undefined;
  }> {
    const searchPromises: Promise<EntityResult.Entity | undefined>[] = [];

    // We still need to search for both channels & networks, even if
    // we know the type, so that we can tell if there would be name conflicts
    searchPromises.push(
      this.getChannel(idOrSlug)
        .then((res) => res.data.entity)
        .catch((err) => {
          const _err = err as AxiosError;
          if (_err.response?.status === 404) {
            this.ctx.$logger.verbose(`"${idOrSlug}" does not exist as a channel`);
          } else {
            this.ctx.$throw(err);
          }
          return undefined;
        })
    );
    searchPromises.push(
      this.getNetwork(idOrSlug)
        .then((res) => res.data.entity)
        .catch((err) => {
          const _err = err as AxiosError;
          if (_err.response?.status === 404) {
            this.ctx.$logger.verbose(`"${idOrSlug}" does not exist as a network`);
          } else {
            this.ctx.$throw(err);
          }
          return undefined;
        })
    );

    const [channel, network] = await Promise.all(searchPromises);

    return {
      channel,
      network,
    };
  }
}

export const buildImageUrls = (
  entity: EntityResult.Entity
): {
  logo: string | undefined;
  thumbnail: string | undefined;
  favicon: string | undefined;
} => {
  const baseUrl = "https://traxxx.me/img/logos/";

  return {
    logo: entity.logo ? `${baseUrl}${entity.logo}` : undefined,
    thumbnail: entity.thumbnail ? `${baseUrl}${entity.thumbnail}` : undefined,
    favicon: entity.favicon ? `${baseUrl}${entity.favicon}` : undefined,
  };
};
