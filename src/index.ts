import { hrtime } from 'process';

import { updateChannelsJson } from './channels';
import {
  cleanFiles,
  getContent,
  mergeSources,
  mergeTxts,
  writeM3u,
  writeM3uToTxt,
  writeSources,
} from './file';
import { updateChannelList, updateReadme } from './readme';
import { sources } from './sources';
import { runCustomTask } from './task/custom';
import { writeTvBoxJson as writeTvBoxLiveJson } from './tvbox';
import { Collector } from './utils';

cleanFiles();

// 执行脚本
(async () => {
  try {
    const sourcesResult = await Promise.allSettled(
      sources.map(async (sr) => {
        console.log(`[TASK] Fetch ${sr.name}`);
        try {
          const [ok, text, now] = await getContent(sr);
          if (ok && !!text) {
            console.log(
              `Fetch m3u from ${sr.name} finished, cost ${
                (parseInt(hrtime.bigint().toString()) - parseInt(now.toString())) / 10e6
              } ms`
            );

            const sourcesCollector = Collector(undefined, (v) => !/^([a-z]+):\/\//.test(v));

            const [m3u, count] = sr.filter(
              text as string,
              ['o_all', 'all'].includes(sr.f_name) ? 'skip' : 'normal',
              sourcesCollector.collect
            );

            await writeM3u(sr.f_name, m3u);
            await writeM3uToTxt(sr.name, sr.f_name, m3u);
            await writeSources(sr.name, sr.f_name, sourcesCollector.result());
            updateChannelList(sr.name, sr.f_name, m3u);
            return ['normal', count];
          }
          console.log(`[WARNING] m3u ${sr.name} get failed!`);
          return ['normal', void 0];
        } catch (e) {
          console.log(e);
          console.log(`[WARNING] m3u ${sr.name} get failed!`);
          return ['normal', void 0];
        }
      })
    );

   // ✅ EPG 已完全禁用
const epgs: any[] = [];
const epgs_res: any[] = [];
    await writeTvBoxLiveJson('tvbox', sources);
    updateChannelsJson(sources, sources_res, epgs_sources);
    updateReadme(sources, sources_res, [], []);

    console.log(`[TASK] Make custom sources`);
    runCustomTask();
  } catch (err) {
    console.error(err);
  }
})();
