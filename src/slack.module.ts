import { DynamicModule, Module, OnApplicationBootstrap } from '@nestjs/common';
import { ExplorerService } from './services/explorer.service';
import { SlackService } from './services/slack.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AnyMiddlewareArgs, App, AppOptions, Middleware } from '@slack/bolt';
import { LoggerProxy } from './loggers/logger.proxy';
import { SlackModuleOptions } from './interfaces/modules/module.options';
import { StringIndexed } from '@slack/bolt/dist/types/helpers';

const SLACK = 'Slack';
const SLACK_MODULE_OPTIONS = 'SLACK_MODULE_OPTIONS';

const slackServiceFactory = {
  provide: 'CONNECTION',
  useFactory: (
    configService: ConfigService,
    loggerProxy: LoggerProxy,
    options: SlackModuleOptions,
  ) => {
    loggerProxy.setName(SLACK);
    const opts: AppOptions = {
      logger: loggerProxy,
      token: configService.get('SLACK_BOT_TOKEN'),
      signingSecret: configService.get('SLACK_SIGNING_SECRET'),
      socketMode: !!configService.get<boolean>('SLACK_SOCKET_MODE'),
      appToken: configService.get('SLACK_APP_TOKEN'),
      ...options,
    };
    return new App(opts);
  },
  inject: [ConfigService, LoggerProxy, SLACK_MODULE_OPTIONS],
};

@Module({})
export class SlackModule implements OnApplicationBootstrap {
  constructor(
    private readonly slackService: SlackService,
    private readonly explorerService: ExplorerService,
  ) {}

  static forRootAsync(
    options: SlackModuleOptions & {
      useFactory?: (...args: any[]) => AppOptions;
      inject?: any[];
      imports?: any[];
    } = {},
  ): DynamicModule {
    return {
      module: SlackModule,
      imports: [ConfigModule.forRoot(), ...(options.imports || [])],
      providers: [
        {
          provide: SLACK_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        ExplorerService,
        LoggerProxy,
        SlackService,
        slackServiceFactory,
      ],
      exports: [SlackService],
    };
  }

  static forRoot(options: SlackModuleOptions = {}): DynamicModule {
    return {
      module: SlackModule,
      imports: [ConfigModule.forRoot()],
      providers: [
        {
          provide: SLACK_MODULE_OPTIONS,
          useValue: options,
        },
        ExplorerService,
        LoggerProxy,
        SlackService,
        slackServiceFactory,
      ],
      exports: [SlackService],
    };
  }

  onApplicationBootstrap() {
    const {
      messages,
      actions,
      commands,
      events,
      shortcuts,
      views,
      middleware,
    } = this.explorerService.explore();

    this.slackService.registerMessages(messages);
    this.slackService.registerActions(actions);
    this.slackService.registerCommands(commands);
    this.slackService.registerEvents(events);
    this.slackService.registerShortcuts(shortcuts);
    this.slackService.registerViews(views);
    this.slackService.registerMiddleware(middleware as any);
    // TODO register other events handler
  }
}
