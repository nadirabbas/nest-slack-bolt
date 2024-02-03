import { MetadataBase } from './base.decorator';
import { SLACK_MIDDLEWARE_METADATA } from './constants';

/**
 * Decorator may be run before a Slack event is handled.
 */
export const Middleware = MetadataBase(SLACK_MIDDLEWARE_METADATA);
