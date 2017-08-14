/* -*- coding: iso-safe -*- */

// TODO A lot of unused code.
// TODO Starting the Daemon from `gui.init` is counter-intuitive.

'use strict';

//// ====== UTILITY ==================================================

const util = (function(){
    const util = {};

    util.die = function die(...args) {
        const msgParts = [];
        for(const a of args){
            msgParts.push(
                typeof a === 'string' ? a : JSON.stringify(a));
        }
        debug.log(...msgParts);
        throw new Error(msgParts.join(' '));
    }

    util.getProp = function getProp(obj,field){
        /** Obtain obj[field], raise error if undefined. */
        const val = obj[field];
        if(val === undefined){
            util.die('No field', JSON.stringify(field),'in', obj);
        }
        return val;
    };

    util.logArgs = function logArgs(func){
        /** On error, log the arguments. */
        const wrapped = function(...args){
            try{
                return func(...args);
            } catch(err){
                console.log('Caught error on arguments\n  ', 
                            args,
                           '\nfor function\n  ', func);
                throw err;
            }
        }
        return wrapped;
    };

    util.range = function range(){
        /** Usage:
          *   util.range(STOP)
          *   util.range(START,STOP)
          *   util.range(START,STOP,STEP)
          */
        const n = arguments.length;
        const [start,stop,step] = 
              n == 1 ? [0, ...arguments, 1]
              : n == 2 ? [...arguments, 1]
              : n == 3 ? arguments
              : util.die(`Expected 1..3 arguments, got ${n}`);
        const r = [];
        for(let m = start; m <= stop; m+=step){
            r.push(m);
        }
        return r;
    }

    util.mapObj = function mapObj(object, callback){
        const r = [];
        for(const field in object){
            r.push(callback(field,object[field]));
        }
        return r;
    }

    util.html2dom = function html2dom(htmlString){
        /** Convert HTML string to DOM object. */
        const div = document.createElement('div');
        div.innerHTML = htmlString;
        return div.childNodes.length != 1 ? div : div.childNodes[0];
    };
    
    util.pad = function pad(value, len, fill=' ',align='right'){
        /** Pad value.toString to len characters, right-aligned.

            @param{value} Some value with toString method.
            @param{len} Requested string length.
            @param{optional fill} Determine what character to pad
            with, defaults to space.
            @param{optional align} Determines orientation of
            filling. Defaults to 'right'. 
        */
        let s = value.toString();
        fill = fill.toString()[0];
        while(s.length < len){
            if(align==='right'){
                s = fill + s;
            }
            else if(align==='left'){
                s = s + fill;
            }
            else{
                throw new Error(`Invalid parameter, align=${align}`);
            }
        }
        return s;
    };

    util.identity = function identity(arg){
        /** identity(X) == X */
        return arg;
    };

    util.loadScript = function loadScript(path){
        /** Loads javascript from `path`. */
        const s = document.createElement('script');
        s.src = path;
        document.head.appendChild(s);
    }

    util.pprint = async function(value){
        /** Pretty-print a value as JSON. */
        const expanded = await util.pprintExpand(value);
        console.log("--------------------------------------------------\n");
        console.log(JSON.stringify(expanded, null, 2));
        console.log({pprint:value});
    }

    util.pprintExpand = async function(obj, json=true, promise=true, circles=true){
        /** Converts an object tree recursively into a pprintable form. 

            Unless disabled by ``promise=False``, promises are replaced by

            {'[[Promise]]': value}
            
            Unless disabled by ``json=False``, 
            
            1. Maps are replaced by {'[[Map]]': [[Key, Value], ...]}.
            2. Non-serializable types are replaced by their `toString`.
            
            Unless disabled by ``circles=false``, circular references are 
            replaced by '[[CircularReference]]'. This is subject to change.
        */
        const knownObjects = new Map();
        return _recur(obj);

        async function _recur(obj){
            /** Steps recursively through the tree. */
            // console.log({'DEBUG':1, s:obj.toString(), obj:JSON.stringify(obj),
            //              known:Array.from(knownObjects),
            //              promise: await obj !== obj
            //             });

            // Circular references
            if(knownObjects.has(obj) && typeof obj === 'object'){
                if(circles) {
                    return {'[[CircularReference]]': obj.toString()};
                }
                else {
                    return obj;
                }
            }
            let ret;
            knownObjects.set(obj, true);
            // Promises 
            if(promise && await obj !== obj){
                ret = {'[[Promise]]': await _recur(await obj)};
            }
            // undefined, null as special cases
            else if(obj === null){
                ret = obj;
            }
            else if(obj === undefined){
                ret = json ? '[[undefined]]' : obj;
            }
            // JSON-compatible non-objects
            else if(['number', 'string', 'boolean'].includes(typeof obj)){
                ret = obj;
            }
            // JSON-incompatible non-objects
            else if(typeof obj !== 'object'){
                ret = {};
                ret[`[[${typeof obj}]]`] = obj.toString();
            }
            // Arrays
            else if(Array.isArray(obj)){
                ret = Promise.all(obj.map(_recur));
            }
            // Maps
            else if(obj instanceof Map){
                if(json){
                    let keyval = [];
                    ret = {'[[Map]]': keyval};
                    for(let [k,v] of obj){
                        keyval.push([await _recur(k), await _recur(v)]);
                    }
                }
                else{
                    ret = new Map();
                    for(let [k,v] of obj){
                        ret.set(await _recur(k), await _recur(v));
                    }
                }
            }
            // Dates
            else if(obj instanceof Date){
                ret = obj.toLocaleString();
            }
            // General objects
            else {
                ret = {};
                for(let field in obj){
                    ret[field] = await _recur(obj[field]);
                }
            }
            return ret; 
        }
    }

    return Object.freeze(util);
})();

//// ====== DEBUG ====================================================

const debug = (function(){
    const debug = {};

    const _devel = new Promise(function(resolve){
        chrome.management.getSelf(resolve);
    }).then(function(self){
        return self.installType == 'development';
    });

    debug.isDevel = async function isDevel(){
        /** true, when installed in developer mode */
        // return _devel;
        return (await options).debugMode;
    }

    debug.ifDevel = async function ifDevel(callback){
        /** Run ``callback`` if developer mode. */
        if(await debug.isDevel){
            return callback();
        }
    }

    
    debug.log = async function log(...args){
        /** If we are in developer mode, do some logging. */
        if(await debug.isDevel()){
            console.log('debug.log:', ...args);
        }
    }

    return debug;
})();


//// ====== OPTIONS ==================================================


const options = (function(){
    const options = {};

    const INFO = options.INFO = Object.freeze({
        waitMinutes: Object.freeze({ 
            cast: Number,
            valueField: 'valueAsNumber',
            default: 5,
            html1: 'Waiting time until suspension in minutes',
            type: 'number'
        }),
        suspendPinnedTabs: Object.freeze({
            cast: Boolean,
            valueField: 'checked',
            default: false,
            html1: 'Suspend pinned tabs?',
            type: 'checkbox',
        }),
        pollInterval: Object.freeze({
            cast: Number,
            valueField: 'valueAsNumber',
            default: 60,
            html1: 'Polling interval in seconds',
            type: 'number'
        }),
        debugMode : Object.freeze({
            cast: Boolean,
            valueField: 'checked',
            default: false,
            html1: 'Enable developer mode?',
            type: 'checkbox'
        })
    });

    options.then = function then(callback){
        const names = Object.getOwnPropertyNames(INFO);
        return new Promise(function(resolve,reject){
            chrome.storage.sync.get('options', function(obj){
                if(chrome.runtime.lastError){
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(obj.options !== undefined ? obj.options : {});
                }
            });
        }).then(function(syncedOpt){
            const opt = {};
            names.forEach(function(name){
                const cast = INFO[name].cast;
                const val = syncedOpt[name];
                opt[name] = val !== undefined ? cast(val) : cast(INFO[name].default);
            });
            return callback(opt);
        });
    }

    options.set = function(obj){
        /** Update option keys, e.g.
          * 
          *     options.set({pollInterval:30, waitMinutes:5});
          * 
          * Returns a promise for the updated options.
          */
        
        // Verify keys of obj.
        const names = Object.getOwnPropertyNames(INFO);
        const nameSet = new Set(names);
        for(const name in obj){
            if(! nameSet.has(name)){
                throw Error(`Not a valid option key: ${name}`);
            }
        }

        return options.then(function(opt){
            for(const name in obj){
                opt[name] = INFO[name].cast(obj[name]);
            }
            chrome.storage.sync.set({options:opt}, function(){
                if(chrome.runtime.lastError){
                    throw chrome.runtime.lastError;
                }
            });
            return opt;
        });
    }

    options.reset = function reset(){
        /** Reset options, by clearing the sync storage.
          * Returns promise that is fulfilled, when the value has been
          * synced. */
        return new Promise(function(resolve,reject){
            chrome.storage.sync.set({options:{}}, function(){
                if(chrome.runtime.lastError){
                    reject(chrome.runtime.lastError);
                } else {
                    debug.log('SYNCED_OPTION',obj.options);
                    resolve(undefined);
                }
            });
        });
    }

    return Object.freeze(options);
})();


//// ====== GUI ELEMENTS AND INIT ====================================


const gui = (function(){

    const gui = {};

    gui.init = function init(){
        let hashItems = location.hash.split('&');
        let doctype = hashItems[0].replace('#','');
        debug.log('gui.init', {doctype});
        let initializer = gui.initializers[doctype];
        if(typeof initializer !== 'function'){
            console.error(Error(`Not a function: gui.initializers.${doctype}`));
            location.href = '#debugpage';
            location.reload();
        } else {
            initializer(document.body);
        }
    }

    gui.initializers = {};

    gui.initializers.backgroundpage = function backgroundpage(){
        debug.log('Nothing to do for #background');
        sott.initDaemon();
        chrome.tabs.onActivated.addListener(function(){
            tabs.updateLastActive();
        });
        tabs.updateLastActive();
        // TODO: Set up communication, where background page is told
        // about changed options.
    };

    gui.initializers.debugpage = function debugpage(parent){
        debug.log('Debug page!');
        for(const field in gui.initializers){
            const initializer = gui.initializers[field];
            if(initializer !== gui.initializers.debugpage){
                debug.log("Initializer:", field);
                initializer(parent);
            }
        }
    }

    gui.initializers.optionspage = function optionspage(parent) {
        const content = [];
        const c = (...args) => content.push(...args);

        options.then(function(opts){

            // Build the page contents
            c('<h1>Options</h1>',
              '<table>',
              '  <tr><th>Description</th><th>Value</th></tr>');
            debug.log('options.INFO', options.INFO);
            debug.log('opts', opts);
            for(const name in options.INFO){
                const opt = options.INFO[name];
                c('  <tr>',
                  `    <td class='options.description'>${opt.html1}</td>`,
                  `    <td class='options.value'>`,
                  `      <input opt='${name}' type='${opt.type}' class='options.input'>`,
                  `    </td>`,
                  `  </tr>`);
            }
            c(`<tr><td></td><td><button class='options.reset'>Reset Options</td></tr>`,
              `</table>`);
            const div = document.createElement('div');
            div.class = 'options';
            div.innerHTML = content.join('\n');

            function updateGuiValues(){
                options.then(function(opt){
                    for(const elem of div.getElementsByClassName('options.input')){
                        const name = elem.getAttribute('opt');
                        const inf = options.INFO[name];
                        elem[inf.valueField] = inf.cast(opt[name]);
                        debug.log('Updated',util.pad(opt[name],5),elem);
                    }
                });
            }

            updateGuiValues();
            
            // Add event handlers
            for(const elem of div.getElementsByClassName('options.input')){
                elem.addEventListener('change', function optChangeHandler(event){
                    const name = elem.getAttribute('opt');
                    const inf = options.INFO[name];
                    const val = inf.cast(elem[inf.valueField]);
                    options.set({[[name]]:val}).then(function(){
                        updateGuiValues();
                    });
                });
            }
            for(const elem of div.getElementsByClassName('options.reset')){
                elem.addEventListener('click', function optResetHandler(event){
                    const r = options.reset()
                    debug.ifDevel(async function(){ 
                        await r;
                        updateGuiValues();
                        debug.log('Options have been reset:', await options);
                    });
                });
            }

            parent.append(div);
            return div;
        });
    };

    gui.initializers.popuppage = async function popuppage(parent){
        const div = document.createElement('div');
        div.style.width = '20em';
        div.style.textAlign = 'center';
        const buttons = [
            { 
                text: 'Suspend current tab',
                action: () => chrome.tabs.getSelected(function(tab){
                    tabs.suspend(tab,{
                        debugText:'Suspended manually',
                        prefix:'Suspended without autoreload',
                        noAutoReload:true,
                        force:true
                    });
                })
            },
            { 
                text: 'Suspend other tabs',
                action: async function(){ 
                    const current = await new Promise(r => chrome.tabs.getSelected(r));
                    const all = await new Promise(r => chrome.tabs.getAllInWindow(null,r));
                    for(const tab of all){
                        if( tab.id != current.id ){
                            tabs.suspend(tab,{
                                debugText:'Suspended manually',
                                force:true
                            });
                        }
                    }
                }
            },
            ... ! await debug.isDevel() ? [] : [{
                text: 'Devel: Suspend current tab (autoreload)',
                action: function(){
                    chrome.tabs.getSelected(null, function(tab){
                        tabs.suspend(tab,{
                            debugText:'Suspended manually (Devel: With autoreload)',
                            force:true
                        });
                    });
                }
            }],
        ];
        for(const {text, action} of buttons){
            const a = document.createElement('a');
            const d = document.createElement('div');
            a.href = '#';
            a.innerText = text;
            a.addEventListener('click', action);
            d.append(a);
            div.append(d);
        }

        parent.append(div);
        return Promise.resolve(div);
    };

    window.addEventListener('DOMContentLoaded', gui.init);
    return Object.freeze(gui);
})();


//// ====== TABS =====================================================


const tabs = (function(){

    const tabs = {};

    tabs.map = async function map(callback=util.identity){
        /** Returns a ``Promise`` for the list of results of
          * ``callback`` applies to all tabs.
          */
        return new Promise(function(resolve){
            return chrome.windows.getAll(null, resolve);
        }).then(function(windows){
            return Promise.all(windows.map(function(window){
                return new Promise(function(resolve){
                    chrome.tabs.getAllInWindow(window.id, function(tabs){
                        resolve(Promise.all(tabs.map(callback)));
                    });
                })
                // Once ``callback`` has been executed for all tabs in
                // all windows, we need to flatten the per-window
                // result lists.
            })).then(function(nestedResults){
                const results = [];
                for(const r of nestedResults){
                    results.push(...r);
                }
                return results;
            });
        });
    };

    let _lastActive = {};
    tabs.lastActive = function(tab){
        /** Calculates the times tab was last seen to be active.
          */
        return _lastActive[tab.id] = 
            tab.active ? new Date() :
            _lastActive[tab.id] ? _lastActive[tab.id] :
            new Date();
    }

    tabs.updateLastActive = function(){
        /** Update and clean up cached information. 
          * Implies removal of no-longer-existing tab IDs.
          * Returns [lastActiveMap, tabList] as promise.
          */
        const newMap = {};
        return tabs.map(function(tab){
            newMap[tab.id] = tabs.lastActive(tab);
            return tab;
        }).then(function(tabList){
            _lastActive = newMap;
            return [newMap,tabList];
        });
    }

    tabs.format = function format(tab){
        /** Produce a formatted string representing a tab. */
        const titleMaxLen = 80;
        const num = util.pad(tab.id, 4, ' ');
        const wnum = util.pad(tab.windowId, 3, ' ');
        const title = tab.title.length <= titleMaxLen ? tab.title 
              : tab.title.substring(0, titleMaxLen);
        const marks = 
              (tab.active ? 'A' : ' ')
            +(tab.pinned ? 'P' : ' ');
        const lastActive = tabs.lastActive(tab).toLocaleTimeString();
        return `${wnum} ${num} ${marks} ${lastActive} ${title}`;
    };

    tabs.dump = function dump(){
        /** Dumps all tabs. **/
        tabs.map(tabs.format).then(function(strings){
            const header = "WIN  TAB  LASTACTIVE TITLE";
            strings = [header,...strings,header];
            console.log(strings.join('\n'));
        });
    };

    // Important: Must not allow suspension of data-uris, to prevent 
    //   suspension-inception.
    tabs.suspendProtocols = new Set(['https:','file:','http:','ftp:']);

    tabs.suspend = async function suspend(tab,{noAutoReload,prefix,force,debugText}={}){
        /** Suspend a tab, by redirecting to a data-uri. 
          * 
          * @params{tab}
          *    The tab to suspend. An object of the form as returned by the
          *    ``chrome.tabs`` API.
          * @params{noAutoReload}
          *    Toggle suppression of auto-reloading suspended tabs on focus.
          * @params{prefix}
          *    A text to display before the back-link in suspended tabs.
          * @params{force}
          *    Force suspension of tab, even if it isn't old enough yet for
          *    regular suspension. One cannot force suspending pinned tabs
          *    when the `suspendPinnedTabs` option is false, nor can one
          *    suspend protocols not in `tabs.suspendProtocols`.
          * @params{debugText}
          *    A text to display in the suspended tab in developer mode.
          *    
          * TODO: tabs.suspend should handle only redirecting, 
          * TODO  not deciding whether to redirect.
          */
        prefix = prefix || 'Suspended';
        const h = (string) => {
            /** Quote string for html. */
            const tmp = document.createElement('div');
            tmp.innerText = string;
            return tmp.innerHTML;
        };
        const a = (string) => {
            /** Escape string as attribute. */
            return `"${encodeURI(decodeURI(string))}"`;
        }
        const iconmeta = tab.favIconUrl
              ? `<link rel='shortcut icon' type='image/x-icon' href=${a(tab.favIconUrl)}>`
              : '';
        const suspendPageSource = `
            <html>
              <head>
                <title>${h(tab.title)}</title>
                ${iconmeta}
              </head>
              <body>
                ${prefix}: <a id='B' href=${a(tab.url)}>B</a>
                <script>
                  var B=document.getElementById('B');
                  B.innerText=document.title;
                  /* Guard: Prevent 'focus' from firing twice
                   * and save some characters by using 0 being
                   * falsy. */
                  var G=0;
                  addEventListener('focus',function(){
                    if(G++){
                      if(history.length>2){
                        history.back();
                      } else {
                        location.href=B.href;
                      }
                    }
                  });
                </script>
              </body>
            </html>`
              /* We can safely replace spaces now, because 
               * those in href are protected by encodeURI. */
              .replace(/\/\*(.|\n)*?\*\//g,'')
              .replace(/>\s+/g,'>')
              .replace(/\s+</g,'<')
              .replace(/;\s+/g,';')
              .replace(/{\s+/g,'{')
              .replace(/\s+}/g,'}')
              .replace(/\s+/g,' ');
        const dataURI = `data:text/html;charset=UTF8,${suspendPageSource}`;

        // Saveguard: Suspend only suspendable tabs / don't nest suspending.
        let msg = null;
        const opt = await options;
        const diffMinutes = (new Date().getTime() - tabs.lastActive(tab).getTime())/60000.0;
        const protocol = new URL(tab.url).protocol;
        let doSuspend = false;
        if(tab.active && ! force) {
            msg = ' A';
        } else if(tab.pinned && ! opt.suspendPinnedTabs){
            msg = ' P';
            if(force){
                console.log('SUSPEND_ACTION_REJECTED\n  '+
                            `Cannot force suspending pinned tabs, when the option is disabled.`);
            }
        } else if (! force && diffMinutes <= opt.waitMinutes){
            msg = ' Y';
        } else if (! tabs.suspendProtocols.has(protocol)){ 
            // Protected protocols cannot be forced.
            msg = 'D ';
            if(force){
                console.log('SUSPEND_ACTION_REJECTED\n  '+
                            `Cannot force suspending ${JSON.stringify(protocol)}-URI`);
            }
        } else if(force){
            msg = 'F';
            doSuspend = `Forced suspend.`;
        } else {
            msg = 'S ';
            doSuspend = `Suspended for Age: ${diffMinutes} > ${opt.waitMinutes} minutes.`;
        }
        if(doSuspend){
            console.log('SUSPEND_ACTION\n  ' + doSuspend + '\n  ' + tabs.format(tab));
            chrome.tabs.update(tab.id, {url:dataURI});
        }
        return msg + ' ' + tabs.format(tab);
    };

    return Object.freeze(tabs);

})();


//// ====== SOTT CORE ================================================


const sott = (function(){

    const sott = {};

    let _currentDaemon = null;

    sott.initDaemon = function(){
        /** Start Periodically running background function. */
        let counter = 0; // Just for debug purposes.

        daemonInternal();
        if(_currentDaemon){
            window.clearInterval(_currentDaemon);
        }
        options.then(function(opt){
            window.setInterval(daemonInternal, opt.pollInterval*1000);
        });

        async function daemonInternal(){
            debug.log(`DAEMON_EXECUTE #${++counter}`);
            const report = await tabs.map(tabs.suspend);
            if(await debug.isDevel()){
                debug.log(
                    'SUSPEND_CHECK_REPORT\n'
                        +'(S)uspend this normally or (F)orced or (A)ctive'
                        +' (P)inned (Y)oung (D)on\'t suspend or already suspended\n'
                        +`options ${JSON.stringify(await options)}\n`
                        +report.join('\n'));
            }
        }
    };

    return Object.freeze(sott);

})();

//// ====== TEMPORARY ================================================


const temp = (function(){

    if(location.hash.split('&')[0] != '#debugpage'){
        debug.log('temp module executed only on #debugpage');
        return null;
    }

    const temp = {};

    window.addEventListener('load',async function tempOnLoad(){
        document.body.style.borderStyle = 'dashed';
        const screenshot1 = await html2canvas(document.body);
        document.body.appendChild(screenshot1);
        const screenshot2 = document.createElement('canvas');
        screenshot2.width = 200;
        screenshot2.height = 150;
        const c = screenshot2.getContext('2d');
        c.drawImage(screenshot1, 0, 0, screenshot2.width, screenshot2.height);
        debug.log(`image size = ${screenshot2.toDataURL().length}`);
        const img = document.createElement('img');
        img.src = screenshot2.toDataURL();
        img.style.width = '100%';
        img.style.height = '100%';
        document.body.append(img);
        chrome.storage.local.set({'screenshot2':screenshot2.toDataURL()});
    });

    return temp;
})();

    
//// ====== END ======================================================
