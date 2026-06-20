import { hrtime } from 'process';

import { updateChannelsJson } from './channels';
import { epgs_sources } from './epgs';
import { buildEpgPwXml } from './epgs/epg_pw';
import {
  cleanFiles,
  getContent,
  mergeSources,
  mergeTxts,
  writeEpgJsonByDate,
  writeEpgXML,
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

   // ⛔ 禁用 EPG 抓取
const epgs: any[] = [];

// ⛔ 禁用 epg.pw
// EPG disabled

...
// ⛔ 禁用 EPG JSON 生成
// await writeEpgJsonByDate();
    await writeTvBoxLiveJson('tvbox', sources);
    updateChannelsJson(sources, sources_res, epgs_sources);
    updateReadme(sources, sources_res, epgs_sources, epgs_res);

    console.log(`[TASK] Make custom sources`);
    runCustomTask();
  } catch (err) {
    console.error(err);
  }
})();
