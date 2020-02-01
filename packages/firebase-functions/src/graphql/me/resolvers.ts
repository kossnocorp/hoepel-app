import { IResolvers } from 'graphql-tools'
import { Context } from '../index'
import { Me } from './me'

export const resolvers: IResolvers = {
  Query: {
    me: async (obj, args, { user, token }: Context) => Me.me(token, user),
  },
  User: {
    token: async (obj, args, { token }: Context) => Me.token(token),
  },
}