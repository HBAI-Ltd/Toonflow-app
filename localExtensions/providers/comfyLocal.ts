
async function toonEnsureLocal(service, fetcher, signal, helperToken: string) {
 if (!helperToken) throw new Error("请在供应商设置中填写本机启动助手令牌");
 const base='http://127.0.0.1:9890';
 const headers={'Content-Type':'application/json','X-Toonflow-Launcher':helperToken};
 try {
  // Windows may need up to one minute to restart the local helper.
  // Retry only the startup handshake. ComfyUI's /prompt is submitted separately.
  const reconnectDeadline=Date.now()+75000;
  let r;
  while(true) {
   signal?.throwIfAborted();
   try {
    r=await fetcher(base+'/ensure/'+service,{method:'POST',headers,signal});
    break;
   } catch(error) {
    signal?.throwIfAborted();
    if(Date.now()>=reconnectDeadline) throw error;
    await new Promise(resolve=>setTimeout(resolve,1000));
   }
  }
  if(!r.ok) throw new Error(await r.text());
  const deadline=Date.now()+270000;
  while(Date.now()<deadline) {
   if(signal?.aborted) throw new Error('已取消启动等待');
   const q=await fetcher(base+'/status/'+service,{headers,signal});
   if(!q.ok) throw new Error(await q.text());
   const state=await q.json();
   if(state.status==='ready') return;
   if(state.status==='failed') throw new Error(state.error||'启动失败');
   await new Promise(resolve=>setTimeout(resolve,1000));
  }
  throw new Error('启动等待超时，请查看 D:/stable/local-service-helper/logs');
 } catch(e) {throw new Error('本地服务启动助手：'+(e?.message||String(e))+'；若助手未运行，请双击 D:/stable/local-service-helper/start-helper.vbs');}
}
const rules = [{ type: "input", field: "helperToken", title: "本机启动助手令牌", value: "", props: { type: "password", showPassword: true } }] as const;
const base = 'http://127.0.0.1:8188';
type Graph = Record<string, {class_type:string; inputs:Record<string,any>}>;
const graphs: Record<string,Graph> = {
  "0": {
    "36": {
      "inputs": {
        "vae_name": "minimax_h3_video_vae_int8_convrot.safetensors"
      },
      "class_type": "VAELoader"
    },
    "37": {
      "inputs": {
        "vae_name": "minimax_h3_audio_vae_fp32.safetensors"
      },
      "class_type": "VAELoader"
    },
    "38": {
      "inputs": {
        "clip_name": "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
        "type": "minimax",
        "device": "default"
      },
      "class_type": "CLIPLoader"
    },
    "53": {
      "inputs": {
        "model": [
          "192",
          0
        ],
        "lora_name": "minimax_h3_dmad_full_dareties_v4_step600_comfy_fro.safetensors",
        "strength_model": 0.8000000000000002
      },
      "class_type": "LoraLoaderModelOnly"
    },
    "192": {
      "inputs": {
        "unet_name": "minimax_h3_hybrid_fl2va_ref2va_b25-49-int8.safetensors",
        "weight_dtype": "default"
      },
      "class_type": "UNETLoader"
    },
    "250": {
      "inputs": {
        "values.a": [
          "259",
          0
        ],
        "expression": "max(5, round(a * 24)) + (5 - (max(5, round(a * 24)) % 17)) % 17"
      },
      "class_type": "ComfyMathExpression"
    },
    "252": {
      "inputs": {
        "aspect_ratio": "9:16 (Portrait Widescreen)",
        "megapixels": 0.35,
        "multiple": 32
      },
      "class_type": "ResolutionSelector"
    },
    "253": {
      "inputs": {
        "samples": [
          "397",
          0
        ],
        "vae": [
          "36",
          0
        ]
      },
      "class_type": "VAEDecode"
    },
    "254": {
      "inputs": {
        "samples": [
          "397",
          0
        ],
        "vae": [
          "37",
          0
        ]
      },
      "class_type": "VAEDecodeAudio"
    },
    "255": {
      "inputs": {
        "sampler_name": "euler"
      },
      "class_type": "KSamplerSelect"
    },
    "259": {
      "inputs": {
        "value": 2
      },
      "class_type": "PrimitiveFloat"
    },
    "261": {
      "inputs": {
        "model": [
          "329",
          0
        ],
        "scheduler": "beta",
        "steps": 10,
        "denoise": 1
      },
      "class_type": "BasicScheduler"
    },
    "263": {
      "inputs": {
        "text": "A small golden fish swims gently through clear water, soft natural light, static camera. Quiet water ambience, no speech."
      },
      "class_type": "Text"
    },
    "265": {
      "inputs": {
        "clip": [
          "38",
          0
        ],
        "vae": [
          "36",
          0
        ],
        "audio_vae": [
          "37",
          0
        ],
        "prompt": [
          "263",
          0
        ],
        "width": [
          "252",
          0
        ],
        "height": [
          "252",
          1
        ],
        "length": [
          "250",
          1
        ],
        "ref_image_size": "max"
      },
      "class_type": "MiniMaxH3ReferenceToVideo"
    },
    "328": {
      "inputs": {
        "conditioning": [
          "265",
          0
        ]
      },
      "class_type": "ConditioningZeroOut"
    },
    "329": {
      "inputs": {
        "model": [
          "401",
          0
        ],
        "vae": [
          "36",
          0
        ],
        "max_resolution": 1024,
        "jpeg_quality": 80,
        "suppress_default_preview": true,
        "preview_frames": 1024,
        "preview_fps": 12,
        "tiny_vae": "taeh3.safetensors"
      },
      "class_type": "ModelPreviewOverrideKJ"
    },
    "331": {
      "inputs": {
        "model": [
          "400",
          0
        ],
        "attention": "comfy kitchen attention"
      },
      "class_type": "ModelAttentionBackend"
    },
    "332": {
      "inputs": {
        "model": [
          "331",
          0
        ],
        "selection": "sol-attn",
        "selection.tau": 1.3,
        "start_percent": 0.2,
        "end_percent": 1,
        "dense_blocks": "",
        "min_tokens": 12288,
        "extra_tokens": 256,
        "sink_conditioning": "exact_kv_and_rows",
        "verbose": true
      },
      "class_type": "BlockSparseAttention"
    },
    "333": {
      "inputs": {
        "model": [
          "332",
          0
        ],
        "shift_video": 12,
        "shift_audio": 3.0000000000000004
      },
      "class_type": "MiniMaxH3SigmaShift"
    },
    "364": {
      "inputs": {
        "images": [
          "253",
          0
        ],
        "audio": [
          "254",
          0
        ],
        "frame_rate": 24,
        "loop_count": 0,
        "filename_prefix": "Toonflow/test_h3",
        "format": "video/h264-mp4",
        "pingpong": false,
        "save_output": true,
        "pix_fmt": "yuv420p",
        "crf": 19,
        "save_metadata": true,
        "trim_to_audio": false
      },
      "class_type": "VHS_VideoCombine"
    },
    "397": {
      "inputs": {
        "model": [
          "329",
          0
        ],
        "positive": [
          "265",
          0
        ],
        "negative": [
          "328",
          0
        ],
        "vae": [
          "36",
          0
        ],
        "latent_image": [
          "265",
          1
        ],
        "sampler": [
          "255",
          0
        ],
        "sigmas": [
          "261",
          0
        ],
        "seed": 151458240,
        "cfg": 1,
        "transition_step": 6,
        "lowres_scale": 0.6000000000000001,
        "rho": 0,
        "w_min": 0.5,
        "w_max": 1,
        "upscaler_model": "h3_upscaler_lms_v0.1.safetensors",
        "highres_tiling": true,
        "upscaler_unload": true
      },
      "class_type": "SelfLiftH3Sampler"
    },
    "400": {
      "inputs": {
        "model": [
          "53",
          0
        ],
        "lora_name": "MysticXXX_MMH3-V1.safetensors",
        "strength_model": 0
      },
      "class_type": "LoraLoaderModelOnly"
    },
    "401": {
      "inputs": {
        "model": [
          "333",
          0
        ],
        "chunks": 2,
        "seq_threshold": 4096
      },
      "class_type": "MiniMaxChunkFeedForward"
    }
  },
  "1": {
    "92": {
      "class_type": "SaveVideo",
      "inputs": {
        "video": [
          "130",
          0
        ],
        "filename_prefix": "video/MiniMax_H3",
        "format": "auto",
        "format.codec": "auto",
        "codec": "auto"
      }
    },
    "115": {
      "class_type": "ResolutionSelector",
      "inputs": {
        "aspect_ratio": "16:9 (Widescreen)",
        "megapixels": 0.4,
        "multiple": 32
      }
    },
    "119": {
      "class_type": "VAELoader",
      "inputs": {
        "vae_name": "minimax_h3_video_vae_int8_convrot.safetensors"
      }
    },
    "120": {
      "class_type": "VAELoader",
      "inputs": {
        "vae_name": "minimax_h3_audio_vae_fp32.safetensors"
      }
    },
    "121": {
      "class_type": "VAEDecodeAudio",
      "inputs": {
        "samples": [
          "125",
          0
        ],
        "vae": [
          "120",
          0
        ]
      }
    },
    "122": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": [
          "125",
          0
        ],
        "vae": [
          "119",
          0
        ]
      }
    },
    "123": {
      "class_type": "KSamplerSelect",
      "inputs": {
        "sampler_name": "res_multistep"
      }
    },
    "124": {
      "class_type": "BasicScheduler",
      "inputs": {
        "model": [
          "127",
          0
        ],
        "scheduler": "simple",
        "steps": [
          "142",
          0
        ],
        "denoise": 1
      }
    },
    "125": {
      "class_type": "SamplerCustomAdvanced",
      "inputs": {
        "noise": [
          "129",
          0
        ],
        "guider": [
          "126",
          0
        ],
        "sampler": [
          "123",
          0
        ],
        "sigmas": [
          "124",
          0
        ],
        "latent_image": [
          "136",
          1
        ]
      }
    },
    "126": {
      "class_type": "BasicGuider",
      "inputs": {
        "model": [
          "141",
          0
        ],
        "conditioning": [
          "136",
          0
        ]
      }
    },
    "127": {
      "class_type": "UNETLoader",
      "inputs": {
        "unet_name": "minimax_h3_ref2va_pruned_int8_convrot.safetensors",
        "weight_dtype": "default"
      }
    },
    "128": {
      "class_type": "CLIPLoader",
      "inputs": {
        "clip_name": "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
        "type": "minimax",
        "device": "default"
      }
    },
    "129": {
      "class_type": "RandomNoise",
      "inputs": {
        "noise_seed": 261662374822964
      }
    },
    "130": {
      "class_type": "CreateVideo",
      "inputs": {
        "images": [
          "122",
          0
        ],
        "audio": [
          "121",
          0
        ],
        "fps": 24,
        "bit_depth": 8,
        "color_space": "sRGB",
        "chroma_subsampling": "auto",
        "codec": "none"
      }
    },
    "131": {
      "class_type": "ComfyMathExpression",
      "inputs": {
        "values.a": [
          "132",
          0
        ],
        "expression": "max(5, round(a * 24)) + (5 - (max(5, round(a * 24)) % 17)) % 17"
      }
    },
    "132": {
      "class_type": "PrimitiveFloat",
      "inputs": {
        "value": 5
      }
    },
    "136": {
      "class_type": "MiniMaxH3ReferenceToVideo",
      "inputs": {
        "clip": [
          "128",
          0
        ],
        "vae": [
          "119",
          0
        ],
        "audio_vae": [
          "120",
          0
        ],
        "ref_images.ref_image_0": [
          "137",
          0
        ],
        "ref_images.ref_image_1": [
          "139",
          0
        ],
        "prompt": [
          "138",
          0
        ],
        "width": [
          "115",
          0
        ],
        "height": [
          "115",
          1
        ],
        "length": [
          "131",
          1
        ],
        "ref_image_size": "match"
      }
    },
    "137": {
      "class_type": "LoadImage",
      "inputs": {
        "image": "red_superboy_on_city_roof.png"
      }
    },
    "138": {
      "class_type": "PrimitiveStringMultiline",
      "inputs": {
        "value": "Bold comic-book ink style, heavy linework, red and blue-black palette, night city. Use <Picture 2> and <Picture 1> as reference frames\nCUT 1: top-down view of the little boy superhero on the rooftop — red cape fluttering in the wind, hands planted on his hips, freckles and a cocky grin as he looks straight up into the camera. The camera slowly descends toward him as he delivers his line — as he speaks, comic-book graphic overlay text word by word in sync with his voice: \"GET READY TO\" - \"MEET\" — \"YOUR\" — \"MAKER\" — huge jagged comic lettering, white with heavy black outlines and red drop shadows, tilted at scrappy angles, until the three words hang stacked in the air above him between his face and the lens.\nTRANSITION: a violent WHIP PAN off the rooftop that SMEARS the floating words away with it, motion-streaked —\nCUT 2: low hero angle on the colossal black mech-kaiju towering over the skyline as it rears back and unleashes a GIANT terrifying ROAR — jaws wide with fangs, red eyes and chest-core flaring blinding bright, blue lightning arcing off its head, the roar's shockwave rippling dust and rattling windows down the buildings, comic-style speed-lines and ink splatter bursting from the impact of the sound. It leans INTO the camera as the roar peaks. Hold on the roar."
      }
    },
    "139": {
      "class_type": "LoadImage",
      "inputs": {
        "image": "mecha_dragon_lightning.png"
      }
    },
    "141": {
      "class_type": "ComfySwitchNode",
      "inputs": {
        "on_false": [
          "127",
          0
        ],
        "on_true": [
          "145",
          0
        ],
        "switch": [
          "146",
          0
        ]
      }
    },
    "142": {
      "class_type": "ComfySwitchNode",
      "inputs": {
        "on_false": [
          "143",
          0
        ],
        "on_true": [
          "144",
          0
        ],
        "switch": [
          "146",
          0
        ]
      }
    },
    "143": {
      "class_type": "PrimitiveInt",
      "inputs": {
        "value": 20
      }
    },
    "144": {
      "class_type": "PrimitiveInt",
      "inputs": {
        "value": 4
      }
    },
    "145": {
      "class_type": "LoraLoaderModelOnly",
      "inputs": {
        "model": [
          "127",
          0
        ],
        "lora_name": "minimax_h3_ref2v_turbo_4step_v0.1_comfyui_bf16.safetensors",
        "strength_model": 1
      }
    },
    "146": {
      "class_type": "PrimitiveBoolean",
      "inputs": {
        "value": false
      }
    }
  },
  "2": {
    "92": {
      "class_type": "SaveVideo",
      "inputs": {
        "video": [
          "130",
          0
        ],
        "filename_prefix": "video/MiniMax_H3",
        "format": "auto",
        "format.codec": "auto",
        "codec": "auto"
      }
    },
    "121": {
      "class_type": "VAEDecodeAudio",
      "inputs": {
        "samples": [
          "125",
          0
        ],
        "vae": [
          "201",
          3
        ]
      }
    },
    "122": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": [
          "125",
          0
        ],
        "vae": [
          "201",
          2
        ]
      }
    },
    "123": {
      "class_type": "KSamplerSelect",
      "inputs": {
        "sampler_name": "res_multistep"
      }
    },
    "124": {
      "class_type": "BasicScheduler",
      "inputs": {
        "model": [
          "127",
          0
        ],
        "scheduler": "simple",
        "steps": [
          "142",
          0
        ],
        "denoise": 1
      }
    },
    "125": {
      "class_type": "SamplerCustomAdvanced",
      "inputs": {
        "noise": [
          "129",
          0
        ],
        "guider": [
          "126",
          0
        ],
        "sampler": [
          "123",
          0
        ],
        "sigmas": [
          "124",
          0
        ],
        "latent_image": [
          "201",
          1
        ]
      }
    },
    "126": {
      "class_type": "BasicGuider",
      "inputs": {
        "model": [
          "141",
          0
        ],
        "conditioning": [
          "201",
          0
        ]
      }
    },
    "127": {
      "class_type": "UNETLoader",
      "inputs": {
        "unet_name": "minimax_h3_fl2va_pruned_int8_convrot.safetensors",
        "weight_dtype": "default"
      }
    },
    "129": {
      "class_type": "RandomNoise",
      "inputs": {
        "noise_seed": 261662374822964
      }
    },
    "130": {
      "class_type": "CreateVideo",
      "inputs": {
        "images": [
          "122",
          0
        ],
        "audio": [
          "121",
          0
        ],
        "fps": 24,
        "bit_depth": 8,
        "color_space": "sRGB",
        "chroma_subsampling": "auto",
        "codec": "none"
      }
    },
    "141": {
      "class_type": "ComfySwitchNode",
      "inputs": {
        "on_false": [
          "127",
          0
        ],
        "on_true": [
          "145",
          0
        ],
        "switch": [
          "146",
          0
        ]
      }
    },
    "142": {
      "class_type": "ComfySwitchNode",
      "inputs": {
        "on_false": [
          "143",
          0
        ],
        "on_true": [
          "144",
          0
        ],
        "switch": [
          "146",
          0
        ]
      }
    },
    "143": {
      "class_type": "PrimitiveInt",
      "inputs": {
        "value": 20
      }
    },
    "144": {
      "class_type": "PrimitiveInt",
      "inputs": {
        "value": 4
      }
    },
    "145": {
      "class_type": "LoraLoaderModelOnly",
      "inputs": {
        "model": [
          "127",
          0
        ],
        "lora_name": "minimax_h3_ref2v_turbo_4step_v0.1_comfyui_bf16.safetensors",
        "strength_model": 1
      }
    },
    "146": {
      "class_type": "PrimitiveBoolean",
      "inputs": {
        "value": false
      }
    },
    "200": {
      "class_type": "MiniMaxH3IntegrationGH",
      "inputs": {
        "main_mode": "text_keyframes",
        "clip_name": "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
        "video_vae_name": "minimax_h3_video_vae_int8_convrot.safetensors",
        "audio_vae_name": "minimax_h3_audio_vae_fp32.safetensors",
        "aspect": "adaptive",
        "megapixels": 0.4,
        "duration_seconds": 5,
        "prompt": "A quiet cinematic landscape at dawn.",
        "task_type": "auto",
        "audio_mode": "native",
        "audio_denoise_strength": 0.0,
        "drive_audio_ordinal": 1,
        "strict_prompt_tags": true,
        "ref_image_size": "match"
      }
    },
    "201": {
      "class_type": "MiniMaxH3IntegrationAdapterGH",
      "inputs": {
        "integration": [
          "200",
          0
        ]
      }
    }
  },
  "3": {
    "1": {
      "class_type": "UNETLoader",
      "inputs": {
        "unet_name": "qwen_image_2.1_int8_convrot.safetensors",
        "weight_dtype": "default"
      }
    },
    "2": {
      "class_type": "CLIPLoader",
      "inputs": {
        "clip_name": "qwen3vl_8b_int8_convrot.safetensors",
        "type": "qwen_image",
        "device": "default"
      }
    },
    "3": {
      "class_type": "VAELoader",
      "inputs": {
        "vae_name": "qwen_image_2.1_vae_bf16.safetensors"
      }
    },
    "4": {
      "class_type": "TextEncodeQwenImage21",
      "inputs": {
        "clip": [
          "2",
          0
        ],
        "vae": [
          "3",
          0
        ],
        "prompt": "A golden fish in clear water, soft light",
        "negative_prompt": "",
        "resolution": 512
      }
    },
    "5": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": 512,
        "height": 512,
        "batch_size": 1
      }
    },
    "6": {
      "class_type": "KSampler",
      "inputs": {
        "model": [
          "1",
          0
        ],
        "positive": [
          "4",
          0
        ],
        "negative": [
          "4",
          1
        ],
        "latent_image": [
          "5",
          0
        ],
        "seed": 1234,
        "steps": 25,
        "cfg": 1,
        "sampler_name": "euler",
        "scheduler": "simple",
        "denoise": 1
      }
    },
    "7": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": [
          "6",
          0
        ],
        "vae": [
          "3",
          0
        ]
      }
    },
    "8": {
      "class_type": "SaveImage",
      "inputs": {
        "images": [
          "7",
          0
        ],
        "filename_prefix": "Toonflow/qwen_test"
      }
    }
  },
  "4": {
    "1": {
      "class_type": "UNETLoader",
      "inputs": {
        "unet_name": "qwen_image_2.1_int8_convrot.safetensors",
        "weight_dtype": "default"
      }
    },
    "2": {
      "class_type": "CLIPLoader",
      "inputs": {
        "clip_name": "qwen3vl_8b_int8_convrot.safetensors",
        "type": "qwen_image",
        "device": "default"
      }
    },
    "3": {
      "class_type": "VAELoader",
      "inputs": {
        "vae_name": "qwen_image_2.1_vae_bf16.safetensors"
      }
    },
    "4": {
      "class_type": "TextEncodeQwenImage21",
      "inputs": {
        "clip": [
          "2",
          0
        ],
        "vae": [
          "3",
          0
        ],
        "prompt": "Change the fish to bright blue, preserve the composition and background.",
        "negative_prompt": "",
        "resolution": 512,
        "images.image_1": [
          "9",
          0
        ]
      }
    },
    "6": {
      "class_type": "KSampler",
      "inputs": {
        "model": [
          "1",
          0
        ],
        "positive": [
          "4",
          0
        ],
        "negative": [
          "4",
          1
        ],
        "latent_image": [
          "4",
          2
        ],
        "seed": 1234,
        "steps": 25,
        "cfg": 1,
        "sampler_name": "euler",
        "scheduler": "simple",
        "denoise": 1
      }
    },
    "7": {
      "class_type": "VAEDecode",
      "inputs": {
        "samples": [
          "6",
          0
        ],
        "vae": [
          "3",
          0
        ]
      }
    },
    "8": {
      "class_type": "SaveImage",
      "inputs": {
        "images": [
          "7",
          0
        ],
        "filename_prefix": "Toonflow/qwen_edit_test"
      }
    },
    "9": {
      "class_type": "LoadImage",
      "inputs": {
        "image": "toonflow_qwen_edit_test.png"
      }
    }
  }
};
async function upload(ctx:any, input:any, extension:string):Promise<string> {
 let bytes:Uint8Array;
 if(input.type==='base64') bytes=Buffer.from(input.data.replace(/^data:[^,]*,/,''),'base64');
 else if(input.type==='binary') bytes=new Uint8Array(input.data);
 else if(input.type==='url') { const u=new URL(input.url); if(!['127.0.0.1','localhost','::1'].includes(u.hostname)) throw new Error('仅支持本机素材地址'); const r=await ctx.tool.fetch(input.url,{signal:ctx.signal}); if(!r.ok) throw new Error('读取素材失败'); bytes=new Uint8Array(await r.arrayBuffer()); }
 else throw new Error('不支持的素材格式');
 const mime=String(input.mimeType||'').toLowerCase(); const known:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','video/webm':'webm','video/quicktime':'mov','audio/wav':'wav','audio/x-wav':'wav','audio/mpeg':'mp3','audio/flac':'flac','audio/ogg':'ogg'}; const ext=known[mime]||extension; const filename='toonflow_'+(Date.now().toString(36)+'-'+Math.random().toString(36).slice(2))+'.'+ext; const boundary='----toonflow'+Date.now().toString(36)+Math.random().toString(36).slice(2); const head=Buffer.from('--'+boundary+'\r\nContent-Disposition: form-data; name="image"; filename="'+filename+'"\r\nContent-Type: '+(mime||'application/octet-stream')+'\r\n\r\n'); const tail=Buffer.from('\r\n--'+boundary+'\r\nContent-Disposition: form-data; name="type"\r\n\r\ninput\r\n--'+boundary+'--\r\n'); const body=Buffer.concat([head,Buffer.from(bytes),tail]);
 const r=await ctx.tool.fetch(base+'/upload/image',{method:'POST',headers:{'Content-Type':'multipart/form-data; boundary='+boundary},body,signal:ctx.signal}); if(!r.ok) throw new Error('上传参考素材失败: '+await r.text()); const j=await r.json(); return j.subfolder ? j.subfolder+'/'+j.name : j.name;
}
async function run(ctx:any,g:Graph,kind:'image'|'video',progressKey?:string,nodeId?:string):Promise<MediaAsset[]> {
 const clientId='toonflow-progress-'+(Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2));
 let submittedPromptId:string|undefined;
 try {
 ctx.signal?.throwIfAborted();
 const r=await ctx.tool.fetch(base+'/prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:g,client_id:clientId}),signal:ctx.signal}); if(!r.ok) throw new Error('ComfyUI 提交失败: '+(await r.text()).slice(0,2000)); const j=await r.json();submittedPromptId=j.prompt_id; if(!j.prompt_id) throw new Error('ComfyUI 未返回任务编号'); if(progressKey){try{const progressResponse=await ctx.tool.fetch('http://127.0.0.1:9890/track/'+encodeURIComponent(progressKey),{method:'POST',headers:{'Content-Type':'application/json','X-Toonflow-Launcher':ctx.config.helperToken},body:JSON.stringify({prompt_id:j.prompt_id,client_id:clientId,node_id:nodeId})});if(!progressResponse.ok){/* Generation continues; no duplicate submission. */}}catch{}}
 for(let i=0;i<10800;i++) { await new Promise(resolve=>setTimeout(resolve,2000)); if(ctx.signal?.aborted) throw new Error('停止等待；ComfyUI 任务可能继续运行'); const h=await ctx.tool.fetch(base+'/history/'+encodeURIComponent(j.prompt_id),{signal:ctx.signal}); if(!h.ok) throw new Error('查询 ComfyUI 任务失败'); const data=(await h.json())[j.prompt_id]; if(!data) continue; if(data.status?.status_str!=='success') throw new Error('ComfyUI 执行失败: '+JSON.stringify(data.status?.messages).slice(-3000)); for(const o of Object.values(data.outputs||{}) as any[]) {const items=kind==='image'?o.images:[...(o.videos||[]),...(o.gifs||[]),...(o.images||[])]; for(const f of items||[]) {if(kind==='video' && !/\.(mp4|webm|mov)$/i.test(f.filename||'')) continue; const q=new URLSearchParams({filename:f.filename,subfolder:f.subfolder||'',type:f.type||'output'});return [{mediaType:kind,type:'url',url:base+'/view?'+q.toString(),mimeType:kind==='video'?'video/mp4':'image/png'}] as MediaAsset[];}} throw new Error('任务完成但没有媒体输出'); }
 throw new Error('等待 ComfyUI 超过 6 小时（含排队时间），请核对本地任务状态');
 } finally {if(ctx.signal?.aborted&&submittedPromptId){try{await ctx.tool.fetch(base+'/api/jobs/'+encodeURIComponent(submittedPromptId)+'/cancel',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});}catch{}}}
}
const ratios:Record<string,string>={'16:9':'16:9 (Widescreen)','9:16':'9:16 (Portrait Widescreen)','1:1':'1:1 (Square)','2:3':'2:3 (Portrait Photo)','3:2':'3:2 (Photo)','4:3':'4:3 (Standard)','3:4':'3:4 (Portrait Standard)'};
export default {
 id:'comfyLocal',label:'ComfyUI 本地 H3 与 Qwen',version:'0.1.0',rules,
 models:[
 {id:'h3-wenwu',label:'MiniMax H3 文武双全',type:'video',mode:['text',['imageReference:9','videoReference:3','audioReference:3']],audio:true,durationResolutionMap:[{duration:[2,3,4,5,6,7,8,9,10],resolution:['480p','720p','1080p']}]},
 {id:'h3-integrated',label:'MiniMax H3 智能一体化',type:'video',mode:['text','startFrameOptional',['imageReference:9','videoReference:3','audioReference:3']],audio:true,durationResolutionMap:[{duration:[2,3,4,5,6,7,8,9,10],resolution:['480p','720p','1080p']}]},
 {id:'qwen-t2i',label:'Qwen Image 2.1 本地生图',type:'image',mode:['text'],imageSizes:['1K'],imageRatios:['1:1','16:9','9:16','4:3','3:4']},
 {id:'qwen-edit',label:'Qwen Image 2.1 本地编辑',type:'image',mode:['singleImage'],imageSizes:['1K'],imageRatios:['1:1','16:9','9:16','4:3','3:4']}
 ],
 async generateImage(request:ImageRequest):Promise<MediaAsset[]> { await toonEnsureLocal('comfy',this.tool.fetch.bind(this.tool),this.signal,this.config.helperToken); const editing=request.model==='qwen-edit'; const g:Graph=JSON.parse(JSON.stringify(graphs[editing?'4':'3'])); if(!request.prompt?.trim()) throw new Error('请输入提示词'); g['4'].inputs.prompt=request.prompt; g['4'].inputs.resolution=1024; g['6'].inputs.seed=Math.floor(Math.random()*2**32); if(editing){if(request.images?.length!==1) throw new Error('编辑需要一张参考图'); g['9'].inputs.image=await upload(this,request.images[0],'png');} else {if(request.images?.length) throw new Error('文生图不接受参考图，请选择编辑模型'); const sizes:Record<string,number[]>={'1:1':[1024,1024],'16:9':[1344,768],'9:16':[768,1344],'4:3':[1152,864],'3:4':[864,1152]}; const [width,height]=sizes[request.ratio||'1:1']||sizes['1:1']; Object.assign(g['5'].inputs,{width,height});} return run(this,g,'image');},
 async generateVideo(request:VideoRequest):Promise<MediaAsset[]> { if(request.model==='h3-reference')throw new Error('参考生视频工作流已禁用，请选择 MiniMax H3 文武双全'); if(!['h3-wenwu','h3-integrated'].includes(request.model))throw new Error('请选择可用的本地 H3 工作流'); await toonEnsureLocal('comfy',this.tool.fetch.bind(this.tool),this.signal,this.config.helperToken); const q=request as any; if(!q.prompt?.trim()) throw new Error('请输入提示词'); const prompt=String(q.prompt).replace(/\{\{ref (\d+)\}\}/g,(_m:string,num:string)=>{let ref=q.referenceOrder?.[Number(num)-1]; if(!ref){const candidates=[...(q.images||[]).map((_:any,index:number)=>({type:'image',index})),...(q.videos||[]).map((_:any,index:number)=>({type:'video',index})),...(q.audios||[]).map((_:any,index:number)=>({type:'audio',index}))];if(Number(num)===1 && candidates.length===1 && !q.firstFrame && !q.lastFrame) ref=candidates[0];else throw new Error('Toonflow 未提供多素材引用顺序，请只引用一个素材，或在 ComfyUI 工作流节点中使用多素材');} if(ref.type==='text') return ''; if(ref.type==='firstFrame') return '<Picture 1>'; if(ref.type==='lastFrame') return '<Picture 2>'; const labels:Record<string,string>={image:'Picture',video:'Video',audio:'Audio'};if(!labels[ref.type]||!Number.isInteger(ref.index)) throw new Error('引用标记无效');return '<'+labels[ref.type]+' '+(ref.index+1)+'>';}); const idx=q.model==='h3-wenwu'?'0':q.model==='h3-reference'?'1':'2'; const g:Graph=JSON.parse(JSON.stringify(graphs[idx])); const images=q.images||[],videos=q.videos||[],audios=q.audios||[]; if(images.length>9||videos.length>3||audios.length>3||images.length+videos.length+audios.length>12) throw new Error('参考素材数量超出 H3 限制'); const duration=Number(q.duration ?? 5); if(!Number.isInteger(duration)||duration<2||duration>10) throw new Error('时长须为 2–10 秒的整数');
 const selectedResolution=q.resolution||'480p'; const shortSide=({'480p':480,'720p':720,'1080p':1080} as Record<string,number>)[selectedResolution]; if(!shortSide)throw new Error('请选择 480p、720p 或 1080p'); const aspectParts=String(q.ratio||'16:9').split(':').map(Number);const aspect=aspectParts[0]/aspectParts[1];if(!Number.isFinite(aspect)||aspect<=0)throw new Error('无效画幅');const width=Math.round((aspect>=1?shortSide*aspect:shortSide)/32)*32;const height=Math.round((aspect>=1?shortSide:shortSide/aspect)/32)*32; if(idx!=='2'){const dimensions=g[idx==='0'?'265':'136'].inputs;dimensions.width=width;dimensions.height=height;}
 if(idx==='2') {const n=g['200'].inputs;n.megapixels=width*height/1000000; for(const key of ['first_frame','last_frame','hybrid_audio',...Array.from({length:9},(_,i)=>'ref_image_'+(i+1)),...Array.from({length:3},(_,i)=>'ref_video_'+(i+1)),...Array.from({length:3},(_,i)=>'ref_audio_'+(i+1))]) n[key]=''; n.prompt=prompt;n.duration_seconds=duration;n.aspect=q.ratio||'adaptive';n.main_mode='all_reference'; for(let i=0;i<images.length;i++)n['ref_image_'+(i+1)]=await upload(this,images[i],'png');for(let i=0;i<videos.length;i++)n['ref_video_'+(i+1)]=await upload(this,videos[i],'mp4');for(let i=0;i<audios.length;i++)n['ref_audio_'+(i+1)]=await upload(this,audios[i],'wav');if(q.firstFrame)n.first_frame=await upload(this,q.firstFrame,'png');if(q.lastFrame)n.last_frame=await upload(this,q.lastFrame,'png'); if(q.firstFrame||q.lastFrame)n.main_mode='text_keyframes';}
 else {if(q.firstFrame||q.lastFrame) throw new Error('此工作流使用图片参考，请使用智能一体化处理首尾帧'); const n=g[idx==='0'?'265':'136'].inputs; if(idx==='0'){g['263'].inputs.text=prompt;g['259'].inputs.value=duration;g['397'].inputs.seed=Math.floor(Math.random()*2**32);}else {g['138'].inputs.value=prompt;g['132'].inputs.value=duration; delete g['137'];delete g['139'];for(const k of Object.keys(n))if(k.startsWith('ref_images.'))delete n[k];g['129'].inputs.noise_seed=Math.floor(Math.random()*2**32);} for(let i=0;i<images.length;i++){const id=String(9000+i);g[id]={class_type:'LoadImage',inputs:{image:await upload(this,images[i],'png')}};n['ref_images.ref_image_'+i]=[id,0];} for(let i=0;i<videos.length;i++){const id=String(9100+i);g[id]={class_type:'VHS_LoadVideo',inputs:{video:await upload(this,videos[i],'mp4'),force_rate:24,custom_width:0,custom_height:0,frame_load_cap:0,skip_first_frames:0,select_every_nth:1,format:'None'}};n['ref_videos.ref_video_'+i]=[id,0];}for(let i=0;i<audios.length;i++){const id=String(9200+i);g[id]={class_type:'LoadAudio',inputs:{audio:await upload(this,audios[i],'wav')}};n['ref_audios.ref_audio_'+i]=[id,0];} if(q.ratio){const ratio=ratios[q.ratio];if(!ratio) throw new Error('不支持该画幅');g[idx==='0'?'252':'115'].inputs.aspect_ratio=ratio;}}
 return run(this,g,'video',(request as any).other?.__toonProgressKey,(request as any).other?.__toonNodeId);}
} satisfies ProviderDefinition<typeof rules>;
