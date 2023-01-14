import knex, { Knex } from 'knex';

import config from '../config';
import knexConfig from './knexfile';

const knexInstance: Knex.Config = knexConfig[config.NODE_ENV];

export default knex(knexInstance);
