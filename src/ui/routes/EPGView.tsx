/*
   Copyright 2026 kanreisa

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { detectAreaFromServices } from "../modules/constants";
import { useParams } from "react-router";
import { Alignment, Button, Navbar, Tabs, Tab, HTMLSelect, Breadcrumbs } from "@blueprintjs/core";
import { DateTime } from "luxon";

import { state } from "../modules/state";
import * as ui from "../modules/ui";
import { useLocalStorageState } from "../hooks/useWebStorageState";

import { ChannelType } from "../../../api";

import { WatchButton } from "../components/WatchButton";
import { EPGTable } from "../components/EPGTable";

export const EPGView: React.FC = () => {
    console.debug("routes", "EPG");

    const params = useParams();
    const { navigate, searchParams } = state;

    const [channelType, setChannelType] = useLocalStorageState<ChannelType>("EPG.channelType", "GR");
    const [programId, setProgramId] = useState<number>(null);
    const [time, setTime] = useState<number>(null);
    const [serviceVersion, setServiceVersion] = useState(0);

    useEffect(() => {
        const handler = () => setServiceVersion(v => v + 1);
        state.on("services", handler);
        return () => { state.off("services", handler); };
    }, []);

    // GR + NW系のチャンネルタイプをサービスリストからグルーピングし地域名を判定
    const terrTypeOptions = useMemo(() => {
        const typeServicesMap = new Map<string, typeof state.services>();
        for (const s of state.services) {
            const t = s.channel?.[0]?.type;
            if (t === "GR" || t?.startsWith("NW")) {
                if (!typeServicesMap.has(t)) typeServicesMap.set(t, []);
                typeServicesMap.get(t)!.push(s);
            }
        }
        const options: { value: string; label: string }[] = [];
        // GR・NW系とも地域名が判定できた場合のみリストに追加（"地上"ラベルは廃止）
        for (const t of ["GR", ...[...typeServicesMap.keys()].filter(k => k.startsWith("NW")).sort((a, b) => parseInt(a.slice(2)) - parseInt(b.slice(2)))]) {
            if (!typeServicesMap.has(t)) continue;
            const area = detectAreaFromServices(typeServicesMap.get(t)!);
            if (area) {
                options.push({ value: t, label: area });
            }
        }
        return options;
    }, [serviceVersion]);
    const globalServiceId = parseInt(params.globalServiceId, 10) || null;
    const programIdQuery = searchParams.get("programId");
    const typeQuery = searchParams.get("type");
    const dateQuery = searchParams.get("date");
    const timeQuery = searchParams.get("time");
    const now = DateTime.now();
    const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(dateQuery) ? dateQuery : now.toISODate();
    const startDate = now.startOf("day");
    const endDate = startDate.plus({ days: 7 });

    let date = DateTime.fromISO(isoDate);

    if (globalServiceId) {
        date = date.set({ day: now.day });
    }

    if (typeQuery) {
        if (typeQuery === "ALL") {
            if (channelType !== null) {
                setChannelType(null);
                return;
            }
        } else if (typeQuery !== channelType) {
            setChannelType(typeQuery as ChannelType);
            return;
        }
    } else if (!globalServiceId && !programIdQuery && !timeQuery) {
        let to = `?type=${channelType || "ALL"}&date=${isoDate}`;
        setTimeout(() => navigate(to, { replace: true }), 0);
        return;
    }

    let hasRemovedTempParams = false;
    if (programIdQuery) {
        setProgramId(parseInt(programIdQuery, 10));
        searchParams.delete("programId");
        hasRemovedTempParams = true;
    }
    if (timeQuery) {
        setTime(parseInt(timeQuery, 10));
        searchParams.delete("time");
        hasRemovedTempParams = true;
    }
    if (hasRemovedTempParams) {
        setTimeout(() => navigate(`?${searchParams.toString()}`, { replace: true }), 0);
        return;
    }

    if (!globalServiceId) {
        ui.setTitle("EPG");
    }

    const toolbarTabs: React.JSX.Element[] = [];
    if (date >= startDate && date <= endDate && !globalServiceId) {
        for (let i = 0; i <= 7; i++) {
            const cur = startDate.plus({ days: i });
            const id = `epg-toolbar-tabs-item-${cur.toISODate()}`;
            const d = i === 0 ? cur.toFormat("M/d") : cur.toFormat("d");
            const c = cur.toFormat("ccc");
            toolbarTabs.push(<Tab key={id} id={id} title={<>{d}<sup className={`color-dow-${cur.weekday}`}>{c}</sup></>} />);
        }
    } else {
        const id = `epg-toolbar-tabs-item-${date.toISODate()}`;
        const title = date.toFormat("yyyy/MM/dd(ccc)");
        toolbarTabs.push(<Tab key={id} id={id} title={title} />);
    }

    const showTodayButton = (!globalServiceId && toolbarTabs.length === 1) || (globalServiceId && date.toMillis() !== startDate.toMillis());

    return (
        <div className="route" id="route-epg">
            <Navbar className="toolbar">
                <Navbar.Group align={Alignment.START}>
                    <Navbar.Heading>
                        {globalServiceId
                            ? <Breadcrumbs items={[
                                { text: "EPG 番組表", onClick: () => {
                                    let to = `/epg?type=${channelType || ""}`;
                                    if (isoDate) {
                                        to += `&date=${isoDate}`;
                                    }
                                    if (time) {
                                        to += `&time=${time}`;
                                    }
                                    navigate(to)
                                } },
                                { text: "週間" },
                                { text: "放送サービス...", className: "heading-title bp6-skeleton" }
                            ]} />
                            : "EPG 番組表"
                        }
                    </Navbar.Heading>
                </Navbar.Group>

                <Navbar.Group align={Alignment.END}>
                    {globalServiceId && (
                        <>
                            <WatchButton variant="outlined" popoverPlacement="bottom-start" globalServiceId={globalServiceId} />
                        </>
                    )}
                    {!globalServiceId && (
                        <>
                            {showTodayButton && (
                                <Button variant="minimal" icon="reset" text="今日" onClick={() => {
                                    navigate("?", { replace: true });
                                }} />
                            )}

                            <Tabs id="epg-toolbar-tabs"
                                selectedTabId={`epg-toolbar-tabs-item-${isoDate}`}
                                onChange={(tabId: string) => {
                                    const to = tabId.replace(/^epg-toolbar-tabs-item-/, "");
                                    if (isoDate !== to) {
                                        navigate(`?date=${to}&type=${channelType || "ALL"}`);
                                    }
                                }}
                            >
                                {toolbarTabs}
                            </Tabs>

                            <Navbar.Divider />

                            <HTMLSelect
                                className="bp6-outlined"
                                options={[
                                    { value: "ALL", label: "全波" },
                                    ...terrTypeOptions,
                                    { value: "BS" },
                                    { value: "CS" },
                                    { value: "SKY" },
                                ]}
                                value={channelType || ""}
                                onChange={event => {
                                    ui.blur();

                                    const type = event.currentTarget.value;

                                    let to = `/epg?type=${type}`;
                                    if (isoDate) {
                                        to += `&date=${isoDate}`;
                                    }

                                    navigate(to);
                                }}
                            />
                        </>
                    )}
                </Navbar.Group>
            </Navbar>

            <div className="content no-margin">
                {globalServiceId
                    ? <EPGTable date={date} defaultTime={time} globalServiceId={globalServiceId} />
                    : <EPGTable date={date} defaultTime={time} defaultProgramId={programId} channelType={channelType} />
                }
            </div>
        </div>
    );
};
