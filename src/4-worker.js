<!-- SHEET WORKERS -->
<script type="text/worker">

////////////////////////////////////////////////////////////////////////////////
//
//                                   EVENTS
//
////////////////////////////////////////////////////////////////////////////////

	on("sheet:opened", (eventinfo) => {
		pfom.sheet_open(eventinfo);
		pfom.get_total_values();
	});

// =============================================================================
// -----------------------------------------------------------------------------
// # Events : MIGRATE
// -----------------------------------------------------------------------------
// =============================================================================

	// === Migrate from Official
	on("clicked:migrate_confirm", () => { // NEW
		pfom.migrate_from_official();
	});
	on("clicked:migrate_cancel", () => { // NEW
		pfom.close_migrate_confirm();
	});

// =============================================================================
// -----------------------------------------------------------------------------
// # Events : MANCERS
// -----------------------------------------------------------------------------
// =============================================================================

	// === Charactermancer
	on("clicked:mancer_confirm", () => {
		setAttrs({"mancer_confirm_flag": "0", "charactermancer_step": "l1-welcome"}, {silent: true}, () => {
			pfom.check_l1_mancer();
		});
	});
	on("clicked:mancer_npc", () => {
		setAttrs({"mancer_confirm_flag": "0", "l1mancer_status": "completed", "npc": "1"}, {silent: true});
	});
	on("clicked:mancer_cancel", () => {
		setAttrs({"mancer_confirm_flag": "0", "l1mancer_status": "completed"}, {silent: true});
	});
	on("mancer:cancel", (eventinfo) => {
		if (!eventinfo["value"]) {
			return;
		}
		let update = {};
		if (eventinfo["value"] == "spell-cancel") { // Spell drop
			console.dir(eventinfo);
			update["pcdrop_name"] = "";
			update["pcdrop_uniq"] = "";
			update["pcdrop_category"] = "";
			update["pcdrop_data"] = "";
			update["pcdrop_content"] = "";
			update["l1mancer_status"] = "completed";
			update["charactermancer_step"] = "l1-welcome";
			deleteCharmancerData(["spell-choose"]);
		} else { // Character mancer
			if (eventinfo["value"] === "l1-welcome" || eventinfo["value"] === "l1-cancel") {
				update["l1mancer_status"] = "completed";
				update["charactermancer_step"] = "l1-welcome";
				deleteCharmancerData(["l1-welcome","l1-abilities","l1-race","l1-class","l1-feats","l1-equipment","l1-spells","l1-summary"]);
			} else if (eventinfo["value"].substring(0,3) === "l1-") {
				update["l1mancer_status"] = eventinfo["value"];
			}
		}
		setAttrs(update);
	});
	on("clicked:cancel", () => {
		showChoices(["cancel-prompt"]);
		// console.log("*** DEBUG Mancer cancel: " + JSON.stringify(getCharmancerData(),null,"  "));
	});
	on("clicked:continue", () => {
		hideChoices(["cancel-prompt"]);
	});
	on("mancerfinish:l1-mancer", (eventinfo) => {
		pfom.mancer_finish(eventinfo);
	});
	on("clicked:relaunch_lvl1mancer", (eventinfo) => {
		getAttrs(["l1mancer_status"], (v) => {
			let update = {};
			if (v["l1mancer_status"] === "completed") {
				update["l1mancer_status"] = "relaunch";
			}
			setAttrs(update, {silent: true}, () => {
				pfom.check_l1_mancer();
			});
		});
	});

	// === Spellmancer
	on("mancerfinish:spell-choose", (eventinfo) => {
		finishCharactermancer();
		// console.dir(eventinfo);
		let level = "0";
		let caster = "1";
		if (eventinfo.data && eventinfo.data["spell-choose"] && eventinfo.data["spell-choose"].values && eventinfo.data["spell-choose"].values.spell_level) {
			level = eventinfo.data["spell-choose"].values.spell_level;
		}
		if (eventinfo.data && eventinfo.data["spell-choose"] && eventinfo.data["spell-choose"].values && eventinfo.data["spell-choose"].values.spell_class) {
			caster = eventinfo.data["spell-choose"].values.spell_class;
		}
		pfom.pc_drop_spell(level, caster);
	});

// =============================================================================
// -----------------------------------------------------------------------------
// # Events : GENERAL
// -----------------------------------------------------------------------------
// =============================================================================

	// === General functions
	on("clicked:recalculate", () => {
		pfom.recalculate("all");
	});
	on("clicked:rest", () => {
		getSectionIDs("abilities", (abarray) => {
			getSectionIDs("spell-like", (splarray) => {
				if (abarray.length || splarray.length) {
					let fields = ["setting_maxrest"];
					fields.push(...abarray.map((id) => `repeating_abilities_${id}_perday_max`));
					fields.push(...splarray.map((id) => `repeating_spell-like_${id}_perday_max`));
					getAttrs(fields, (v) => {
						let update = {}, setmax = (parseInt(v["setting_maxrest"]) || 0);
						abarray.map((abid) => update[`repeating_abilities_${abid}_perday`] = (setmax == 1) ? (parseInt(v[`repeating_abilities_${abid}_perday_max`]) || 0) : 0);
						splarray.map((splid) => update[`repeating_spell-like_${splid}_perday`] = (setmax == 1) ? (parseInt(v[`repeating_spell-like_${splid}_perday_max`]) || 0) : 0);
						setAttrs(update, {silent: true});
					});
				}
			});
		});
	});

	// === PC Compendium Drop
	on("change:pcdrop_data",(e) => {
		// console.log("*** DEBUG change:pcdrop_data:e: " + JSON.stringify(e,null,"  "));
		if ((!e.triggerType) || (e.triggerType && e.triggerType == "compendium")) {
			if (e && e.newValue) {
				let cdata;
				try{
					cdata = JSON.parse(e.newValue) || {};
				}
				catch(error){
					cdata = {};
					// console.log("*** DEBUG change:pcdrop_data: no valid data");
				}
				if (! _.isEmpty(cdata)) {
					pfom.pc_drop_handler(cdata);
				} else {
					console.log("*** DEBUG change:pcdrop_data: empty data");
				}
			}
		}
	});

	// === Repeating Items Controller
	on("clicked:repcontrol_toggle_button", () => { // NEW
		getAttrs(["repcontrol_toggle"], (v) => {
			let n = v["repcontrol_toggle"] == "0" ? "1" : "0";
			setAttrs({
				"repcontrol_toggle" : n,
				"repcontrol_toggle_buffs" : n,
				"repcontrol_toggle_attacks" : n,
				"repcontrol_toggle_skillcraft" : n,
				"repcontrol_toggle_skillknowledge" : n,
				"repcontrol_toggle_skillperform" : n,
				"repcontrol_toggle_skillprofession" : n,
				"repcontrol_toggle_skillcustom" : n,
				"repcontrol_toggle_acitems" : n,
				"repcontrol_toggle_gear" : n,
				"repcontrol_toggle_feats" : n,
				"repcontrol_toggle_abilities" : n,
				"repcontrol_toggle_spell-0" : n,
				"repcontrol_toggle_spell-1" : n,
				"repcontrol_toggle_spell-2" : n,
				"repcontrol_toggle_spell-3" : n,
				"repcontrol_toggle_spell-4" : n,
				"repcontrol_toggle_spell-5" : n,
				"repcontrol_toggle_spell-6" : n,
				"repcontrol_toggle_spell-7" : n,
				"repcontrol_toggle_spell-8" : n,
				"repcontrol_toggle_spell-9" : n,
				"repcontrol_toggle_spell-like" : n,
				"repcontrol_toggle_metamagic" : n
			});
		});
	});

	// === Spellcasting Mode
	on("clicked:spellcasting_mode_toggle_button", () => { // NEW
		getAttrs(["spellcasting_mode_toggle"], (v) => {
			let b = v["spellcasting_mode_toggle"] == "0";
			let s = b ? "mp" : "sp";
			setAttrs({
				"spellcasting_mode_toggle" : b ? "1" : "0",
				"spellcasting_mode" : s
			}, {silent: false}, () => {
				pfom.update_all_spell_spend_mp();
			});
		});
	});

// =============================================================================
// -----------------------------------------------------------------------------
// # Events : NPC ICONS
// -----------------------------------------------------------------------------
// =============================================================================

	// === NPC Icon Type
	on("change:npc_icon_type_choice", () => { // NEW
		getAttrs(["npc_icon_type_choice"], (v) => {
			setAttrs({"npc_icon_type" : v["npc_icon_type_choice"]});
		});
	});

	// === NPC Icon Terrain
	on("change:npc_icon_terrain_choice", () => { // NEW
		getAttrs(["npc_icon_terrain_choice"], (v) => {
			setAttrs({"npc_icon_terrain" : v["npc_icon_terrain_choice"]});
		});
	});

	// === NPC Icon Climate
	on("change:npc_icon_climate_choice", () => { // NEW
		getAttrs(["npc_icon_climate_choice"], (v) => {
			setAttrs({"npc_icon_climate" : v["npc_icon_climate_choice"]});
		});
	});

// =============================================================================
// -----------------------------------------------------------------------------
// # Events : OPTIONS CONTROLS
// -----------------------------------------------------------------------------
// =============================================================================

	on("change:repeating_gear:options_flag", (e) => {
		let k = e.sourceAttribute.split("_")[1];
		if (e.newValue == "on") {
			let u = {};
			u[`options_ctrl_${k}`] = "1";
			setAttrs(u, {silent: true});
		}
	});

	on("change:options_ctrl_gear", (e) => {
		let k = e.sourceAttribute.split("_")[2];
		let s = "repeating_" + k;
		let b = false;
		if (e.newValue == "1") b = true;
		getSectionIDs(s, (sec) => {
			let a = [];
			_.each(sec, (id) => {a.push(`${s}_${id}_options_flag`)});
			getAttrs(a, (v) => {
				let u = {};
				_.each(sec, (id) => {u[`${s}_${id}_options_flag`] = b ? "on" : "0"});
				setAttrs(u, {silent: true});
			});
		});
	});

// =============================================================================
// -----------------------------------------------------------------------------
// # Events : CLASSES / MULTICLASSING / MULTICASTING
// -----------------------------------------------------------------------------
// =============================================================================

	on("change:class1_name change:class2_name change:class3_name change:caster1_flag change:caster2_flag", (e) => {
		pfom.update_class_names(e.sourceAttribute); // => update_spells_dc => update_all_spells
	});
	on("change:class1_level change:class2_level change:class3_level", (e) => {
		pfom.update_class_numbers("level"); // => update_class_names
		pfom.update_skillranks_total();
	});
	on("change:class1_bab change:class2_bab change:class3_bab", (e) => {
		pfom.update_class_numbers("bab");
	});
	on("change:class1_fortitude change:class2_fortitude change:class3_fortitude", (e) => {
		pfom.update_class_numbers("fortitude");
	});
	on("change:class1_reflex change:class2_reflex change:class3_reflex", (e) => {
		pfom.update_class_numbers("reflex");
	});
	on("change:class1_will change:class2_will change:class3_will", (e) => {
		pfom.update_class_numbers("will");
	});
	on("change:class1_speed change:class2_speed change:class3_speed", (e) => {
		pfom.update_class_numbers("speed");
	});
	on("change:class1_skillranks_base change:class2_skillranks_base change:class3_skillranks_base", (e) => {
		pfom.update_skillranks_total();
	});
	on("change:class1_favored change:class2_favored change:class3_favored", (e) => {
		setAttrs({"class_favored": e.triggerName.charAt(5)}, {silent: false});
	});
	on("change:class1_skillranks_misc change:class2_skillranks_misc change:class3_skillranks_misc", () => {
		pfom.update_skillranks_total();
	});

// =============================================================================
// -----------------------------------------------------------------------------
// # Events : ABILITIES
// -----------------------------------------------------------------------------
// =============================================================================

	// === Abilities
	on("change:strength_base change:strength_race change:strength_bonus change:strength_condition", () => {
		pfom.recalculate("strength");
	});
	on("change:dexterity_base change:dexterity_race change:dexterity_bonus change:dexterity_condition", () => {
		pfom.recalculate("dexterity");
	});
	on("change:constitution_base change:constitution_race change:constitution_bonus", () => {
		pfom.recalculate("constitution");
	});
	on("change:intelligence_base change:intelligence_race change:intelligence_bonus", () => {
		pfom.recalculate("intelligence");
	});
	on("change:wisdom_base change:wisdom_race change:wisdom_bonus", () => {
		pfom.recalculate("wisdom");
	});
	on("change:charisma_base change:charisma_race change:charisma_bonus", () => {
		pfom.recalculate("charisma");
	});

	// === NPCs Abilities
	on("change:strength", () => {
		pfom.update_mod("strength");
	});
	on("change:dexterity", () => {
		pfom.update_mod("dexterity");
	});
	on("change:constitution", () => {
		pfom.update_mod("constitution");
	});
	on("change:intelligence", () => {
		pfom.update_mod("intelligence");
	});
	on("change:wisdom", () => {
		pfom.update_mod("wisdom");
	});
	on("change:charisma", () => {
		pfom.update_mod("charisma");
	});

// =============================================================================
// -----------------------------------------------------------------------------
// # Events : ATTRIBUTES
// -----------------------------------------------------------------------------
// =============================================================================

	// === Size
	on("change:size", (e) => {
		pfom.update_size(e.newValue);
	});

	// === HP
	on("change:hp", (e) => {
		getAttrs(["npc","hp","hp_max","hp_condition","hp_bonus"],(v) => {
			if (v.npc != "1") { // PC only
				if (e.sourceType == "player") {
					setAttrs({"hp_base": (parseInt(v.hp) || 0) - (parseInt(v.hp_condition) || 0) - (parseInt(v.hp_bonus) || 0)},{silent: true});
				}
			} else {
				var newv = parseInt(e.newValue) || 0;
				if (newv > 0) {
					if ((parseInt(v.hp_max) || 0) < newv) {
						setAttrs({"hp_max":newv},{silent: true});
					}
				}
			}
		});
	});
	on("change:hp_max", (e) => {
		if (e.sourceType == "player") {
			getAttrs(["npc","hp_max","hp_base_max","hp_condition","hp_bonus"],(v) => {
				if (v.npc != "1") { // PC only
					setAttrs({"hp_base_max": (parseInt(v.hp_max) || 0) - (parseInt(v.hp_condition) || 0) - (parseInt(v.hp_bonus) || 0)},{silent: true});
				}
			});
		}
	});
	on("change:hp_condition change:hp_bonus", (e) => {
		//theoratically only updated by sheetworker
		var oldv = 0, newv = 0;
		oldv = parseInt(e.previousValue) || 0;
		newv = parseInt(e.newValue) || 0;
		if (newv != oldv) {
			getAttrs(["npc","hp_base","hp_base_max","hp_condition","hp_bonus"],(v) => {
				if (v.npc != "1") { // PC only
					var update = {};
					update["hp"] = (parseInt(v.hp_base) || 0) + newv;
					update["hp_max"] = (parseInt(v.hp_base_max) || 0) + newv;
					update["hp_mod"] = (parseInt(v.hp_condition) || 0) + (parseInt(v.hp_bonus) || 0);
					if (parseInt(update["hp_mod"]) > 0) {
						update["hp_mod_flag"] = 2;
					} else if (parseInt(update["hp_mod"]) < 0) {
						update["hp_mod_flag"] = 1;
					} else {
						update["hp_mod_flag"] = 0;
					}
					setAttrs(update,{silent: true});
				}
			});
		}
	});

	// === HD
	on("change:class_favored change:class1_hitdietype change:class2_hitdietype change:class3_hitdietype", () => {
		pfom.update_hitdie();
	});

	// === Initiative
	on("change:initiative_misc change:initiative_bonus", () => {
		pfom.update_initiative();
	});

	// === Speed
	on("change:speed_race change:speed_class change:base_run_factor", () => {
		pfom.update_ac_items();
	});
	on("change:speed_notmodified change:speed_encumbrance change:speed_armor change:armor_run_factor change:encumbrance_run_factor change:speed_base change:speed_bonus change:speed_run_factor change:speed_condition change:speed_condition_multiplier change:speed_condition_nospeed change:speed_condition_norun change:speed_climb_misc change:speed_climb_bonus change:speed_swim_misc change:speed_swim_bonus", () => {
		pfom.update_speed();
	});

	// === AC
	on("change:ac_ability_maximum change:encumbrance_ability_maximum change:ac_condition_nobonus change:ac_secab_monk", (e) => {
		pfom.update_ac_ability(e.sourceAttribute); // => ac (=> cmd)
	});
	on("change:ac_ability_primary change:ac_ability_secondary", (e) => {
		pfom.update_ac_ability(e.newValue); // => ac (=> cmd)
	});
	on("change:ac_bonus change:ac_misc change:ac_armor change:ac_shield change:ac_ability_mod change:ac_size change:ac_flatfooted_items change:ac_touch_items change:ac_natural_items change:ac_deflection_items change:ac_dodge_items change:ac_armor_bonus change:ac_shield_bonus change:ac_natural_bonus change:ac_deflection_bonus change:ac_dodge_bonus change:ac_noflatflooted change:ac_touchshield change:ac_condition", () => {
		pfom.update_ac(); // => cmd
	});

	// === AC Items
	on("remove:repeating_acitems change:repeating_acitems:equipped change:repeating_acitems:ac_bonus change:repeating_acitems:flatfooted_bonus change:repeating_acitems:touch_bonus change:repeating_acitems:natural_bonus change:repeating_acitems:deflection_bonus change:repeating_acitems:dodge_bonus change:repeating_acitems:type change:repeating_acitems:check_penalty change:repeating_acitems:max_dex_bonus change:repeating_acitems:spell_failure change:repeating_acitems:armor_speed_reduced change:repeating_acitems:run_factor_reduced", (e) => { // EDIT
		pfom.update_ac_items(e.sourceAttribute); // => ac_ability (=> ac (=> cmd)) / speed / skills
	});

	// === Saves
	on("change:fortitude_base change:fortitude_ability change:fortitude_misc change:fortitude_bonus", () => {
		pfom.update_save("fortitude");
	});
	on("change:reflex_base change:reflex_ability change:reflex_misc change:reflex_bonus", () => {
		pfom.update_save("reflex");
	});
	on("change:will_base change:will_ability change:will_misc change:will_bonus", () => {
		pfom.update_save("will");
	});

	// === BAB / Combat Maneuvers / Critic Confirm / SR
	on("change:bab", (e) => {
		pfom.update_babs_all();
	});
	on("change:cmb_ability change:cmb_misc change:cmb_bonus", () => {
		pfom.update_babs("cmb");
	});
	on("change:melee_ability change:melee_misc change:melee_bonus", () => {
		pfom.update_babs("melee");
	});
	on("change:ranged_ability change:ranged_misc change:ranged_bonus", () => {
		pfom.update_babs("ranged");
	});
	on("change:cmd_misc change:cmd_bonus change:cmd_condition", () => {
		pfom.update_cmd();
	});
	on("change:critconfirm_bonus", () => {
		pfom.update_attacks("all");
		pfom.update_all_spells("all");
	});
	on("change:sr_base change:sr_bonus", () => {
		pfom.update_sr();
	});

	// === Gear Weight
	on("change:repeating_gear:weight change:repeating_gear:quantity", (e) => {
		pfom.update_gear_weight(e.sourceAttribute.substring(15, 35));
	});
	on("change:repeating_gear:weight_total remove:repeating_gear change:encumbrance_coins_flag change:encumbrance_coins_weight change:encumbrance_wealth_flag change:encumbrance_wealth_weight", () => {
		pfom.update_gear_weight_total();
	});
	on("change:money_cp change:money_sp change:money_gp change:money_pp", () => {
		pfom.update_coins_weight();
	});
	on("change:repeating_wealth:quantity change:repeating_wealth:weight", () => {
		pfom.update_wealth_weight();
	});

	// === Gear Cost and Usages
	on("change:repeating_gear:cost change:repeating_gear:uses", (e) => {
		pfom.update_gear_value(e.sourceAttribute.substr(15,20));
	});
	on("change:repeating_gear:usage", (e) => {
		pfom.switch_gear_usage(e.sourceAttribute.substr(15,20));
	});

	// === Encumbrance / Overload
	on("change:encumbrance_load_bonus change:encumbrance_load_multiplier change:encumbrance_gear_weight", () => {
		pfom.update_encumbrance();
	});

	// === Feats / Traits
	on("change:repeating_abilities:perday_qty", (e) => {
		pfom.update_traits(e.sourceAttribute.substring(20, 40));
	});

	// === Weapons / Attacks
	on("change:repeating_attacks:atkname change:repeating_attacks:atkvs change:repeating_attacks:atkflag change:repeating_attacks:atktype change:repeating_attacks:atktype2 change:repeating_attacks:atkmod change:repeating_attacks:atkcritrange change:repeating_attacks:atkrange change:repeating_attacks:dmgflag change:repeating_attacks:dmgbase change:repeating_attacks:dmgattr change:repeating_attacks:dmgmod change:repeating_attacks:dmgcritmulti change:repeating_attacks:dmgtype change:repeating_attacks:dmgbonusdice change:repeating_attacks:dmg2flag change:repeating_attacks:dmg2name change:repeating_attacks:dmg2base change:repeating_attacks:dmg2attr change:repeating_attacks:dmg2mod change:repeating_attacks:dmg2critmulti change:repeating_attacks:dmg2type change:repeating_attacks:dmg2bonusdice change:repeating_attacks:descflag change:repeating_attacks:atkdesc change:repeating_attacks:notes change:repeating_attacks:atkextra1flag change:repeating_attacks:atkextra1name change:repeating_attacks:atkextra1critrange change:repeating_attacks:atkextra1type change:repeating_attacks:atkextra1type2 change:repeating_attacks:atkextra1mod change:repeating_attacks:atkextra1dmgbase change:repeating_attacks:atkextra1dmgattr change:repeating_attacks:atkextra1dmgmod change:repeating_attacks:atkextra1dmgtype change:repeating_attacks:atkextra1dmgcritmulti change:repeating_attacks:atkextra2flag change:repeating_attacks:atkextra2name change:repeating_attacks:atkextra2critrange change:repeating_attacks:atkextra2type change:repeating_attacks:atkextra2type2 change:repeating_attacks:atkextra2mod change:repeating_attacks:atkextra2dmgbase change:repeating_attacks:atkextra2dmgattr change:repeating_attacks:atkextra2dmgmod change:repeating_attacks:atkextra2dmgtype change:repeating_attacks:atkextra2dmgcritmulti change:repeating_attacks:atkextra3flag change:repeating_attacks:atkextra3name change:repeating_attacks:atkextra3critrange change:repeating_attacks:atkextra3type change:repeating_attacks:atkextra3type2 change:repeating_attacks:atkextra3mod change:repeating_attacks:atkextra3dmgbase change:repeating_attacks:atkextra3dmgattr change:repeating_attacks:atkextra3dmgmod change:repeating_attacks:atkextra3dmgtype change:repeating_attacks:atkextra3dmgcritmulti", (e) => {
		pfom.update_attacks(e.sourceAttribute.substring(18, 38));
	});
	on("change:rollnotes_attack change:attack_bonus change:damage_bonus change:melee_damage_bonus change:ranged_damage_bonus", () => {
		pfom.update_damage_bonus_flag();
	});

	// === Ammo
	on("change:use_ammo", (e) => { // NEW
		pfom.update_ammo(e.newValue);
	});
	on("change:repeating_attacks:atkammo", (e) => {// NEW
		getAttrs(["use_ammo"], (v) => {
			pfom.update_ammo(v["use_ammo"], e.sourceAttribute.substr(18, 20));
		});
	});

// =============================================================================
// -----------------------------------------------------------------------------
// # Events : SKILLS
// -----------------------------------------------------------------------------
// =============================================================================

	on("change:armor_check_penalty change:encumbrance_check_penalty", () => {
		pfom.update_all_skills();
	});
	on("change:acrobatics_classkill change:acrobatics_ability change:acrobatics_ranks change:acrobatics_misc change:acrobatics_bonus change:acrobatics_armor_penalty", (e) => {
		// console.log("*** DEBUG acrobatics skill : " + JSON.stringify(e,null,"  "));
		pfom.update_skill("acrobatics",e.sourceAttribute);
	});
	on("change:appraise_classkill change:appraise_ability change:appraise_ranks change:appraise_misc change:appraise_bonus change:appraise_armor_penalty", (e) => {
		pfom.update_skill("appraise",e.sourceAttribute);
	});
	on("change:bluff_classkill change:bluff_ability change:bluff_ranks change:bluff_misc change:bluff_bonus change:bluff_armor_penalty", (e) => {
		pfom.update_skill("bluff",e.sourceAttribute);
	});
	on("change:climb_classkill change:climb_ability change:climb_ranks change:climb_misc change:climb_bonus change:climb_armor_penalty", (e) => {
		pfom.update_skill("climb",e.sourceAttribute);
	});
	on("change:craft_classkill change:craft_ability change:craft_ranks change:craft_misc change:craft_bonus change:craft_armor_penalty", (e) => {
		pfom.update_skill("craft",e.sourceAttribute);
	});
	on("change:repeating_skillcraft:classkill change:repeating_skillcraft:name change:repeating_skillcraft:ability change:repeating_skillcraft:ranks change:repeating_skillcraft:misc change:repeating_skillcraft:bonus change:repeating_skillcraft:armor_penalty", (e) => {
		pfom.update_skill(e.sourceAttribute.substring(0, 41),e.sourceAttribute);
	});
	on("change:diplomacy_classkill change:diplomacy_ability change:diplomacy_ranks change:diplomacy_misc change:diplomacy_bonus change:diplomacy_armor_penalty", (e) => {
		pfom.update_skill("diplomacy",e.sourceAttribute);
	});
	on("change:disable_device_classkill change:disable_device_ability change:disable_device_ranks change:disable_device_misc change:disable_device_bonus change:disable_device_armor_penalty", (e) => {
		pfom.update_skill("disable_device",e.sourceAttribute);
	});
	on("change:disguise_classkill change:disguise_ability change:disguise_ranks change:disguise_misc change:disguise_bonus change:disguise_armor_penalty", (e) => {
		pfom.update_skill("disguise",e.sourceAttribute);
	});
	on("change:escape_artist_classkill change:escape_artist_ability change:escape_artist_ranks change:escape_artist_misc change:escape_artist_bonus change:escape_artist_armor_penalty", (e) => {
		pfom.update_skill("escape_artist",e.sourceAttribute);
	});
	on("change:fly_classkill change:fly_ability change:fly_ranks change:fly_misc change:fly_bonus change:fly_armor_penalty", (e) => {
		pfom.update_skill("fly",e.sourceAttribute);
	});
	on("change:handle_animal_classkill change:handle_animal_ability change:handle_animal_ranks change:handle_animal_misc change:handle_animal_bonus change:handle_animal_armor_penalty", (e) => {
		pfom.update_skill("handle_animal",e.sourceAttribute);
	});
	on("change:heal_classkill change:heal_ability change:heal_ranks change:heal_misc change:heal_bonus change:heal_armor_penalty", (e) => {
		pfom.update_skill("heal",e.sourceAttribute);
	});
	on("change:intimidate_classkill change:intimidate_ability change:intimidate_ranks change:intimidate_misc change:intimidate_bonus change:intimidate_armor_penalty", (e) => {
		pfom.update_skill("intimidate",e.sourceAttribute);
	});
	on("change:knowledge_arcana_classkill change:knowledge_arcana_ability change:knowledge_arcana_ranks change:knowledge_arcana_misc change:knowledge_arcana_bonus change:knowledge_arcana_armor_penalty", (e) => {
		pfom.update_skill("knowledge_arcana",e.sourceAttribute);
	});
	on("change:knowledge_dungeoneering_classkill change:knowledge_dungeoneering_ability change:knowledge_dungeoneering_ranks change:knowledge_dungeoneering_misc change:knowledge_dungeoneering_bonus change:knowledge_dungeoneering_armor_penalty", (e) => {
		pfom.update_skill("knowledge_dungeoneering",e.sourceAttribute);
	});
	on("change:knowledge_engineering_classkill change:knowledge_engineering_ability change:knowledge_engineering_ranks change:knowledge_engineering_misc change:knowledge_engineering_bonus change:knowledge_engineering_armor_penalty", (e) => {
		pfom.update_skill("knowledge_engineering",e.sourceAttribute);
	});
	on("change:knowledge_geography_classkill change:knowledge_geography_ability change:knowledge_geography_ranks change:knowledge_geography_misc change:knowledge_geography_bonus change:knowledge_geography_armor_penalty", (e) => {
		pfom.update_skill("knowledge_geography",e.sourceAttribute);
	});
	on("change:knowledge_history_classkill change:knowledge_history_ability change:knowledge_history_ranks change:knowledge_history_misc change:knowledge_history_bonus change:knowledge_history_armor_penalty", (e) => {
		pfom.update_skill("knowledge_history",e.sourceAttribute);
	});
	on("change:knowledge_local_classkill change:knowledge_local_ability change:knowledge_local_ranks change:knowledge_local_misc change:knowledge_local_bonus change:knowledge_local_armor_penalty", (e) => {
		pfom.update_skill("knowledge_local",e.sourceAttribute);
	});
	on("change:knowledge_nature_classkill change:knowledge_nature_ability change:knowledge_nature_ranks change:knowledge_nature_misc change:knowledge_nature_bonus change:knowledge_nature_armor_penalty", (e) => {
		pfom.update_skill("knowledge_nature",e.sourceAttribute);
	});
	on("change:knowledge_nobility_classkill change:knowledge_nobility_ability change:knowledge_nobility_ranks change:knowledge_nobility_misc change:knowledge_nobility_bonus change:knowledge_nobility_armor_penalty", (e) => {
		pfom.update_skill("knowledge_nobility",e.sourceAttribute);
	});
	on("change:knowledge_planes_classkill change:knowledge_planes_ability change:knowledge_planes_ranks change:knowledge_planes_misc change:knowledge_planes_bonus change:knowledge_planes_armor_penalty", (e) => {
		pfom.update_skill("knowledge_planes",e.sourceAttribute);
	});
	on("change:knowledge_religion_classkill change:knowledge_religion_ability change:knowledge_religion_ranks change:knowledge_religion_misc change:knowledge_religion_bonus change:knowledge_religion_armor_penalty", (e) => {
		pfom.update_skill("knowledge_religion",e.sourceAttribute);
	});
	on("change:repeating_skillknowledge:classkill change:repeating_skillknowledge:name change:repeating_skillknowledge:ability change:repeating_skillknowledge:ranks change:repeating_skillknowledge:misc change:repeating_skillknowledge:bonus change:repeating_skillknowledge:armor_penalty", (e) => {
		pfom.update_skill(e.sourceAttribute.substring(0, 45),e.sourceAttribute);
	});
	on("change:linguistics_classkill change:linguistics_ability change:linguistics_ranks change:linguistics_misc change:linguistics_bonus change:linguistics_armor_penalty", (e) => {
		pfom.update_skill("linguistics",e.sourceAttribute);
	});
	on("change:perception_classkill change:perception_ability change:perception_ranks change:perception_misc change:perception_bonus change:perception_armor_penalty", (e) => {
		pfom.update_skill("perception",e.sourceAttribute);
	});
	on("change:perform_classkill change:perform_ability change:perform_ranks change:perform_misc change:perform_bonus change:perform_armor_penalty", (e) => {
		pfom.update_skill("perform",e.sourceAttribute);
	});
	on("change:repeating_skillperform:classkill change:repeating_skillperform:name change:repeating_skillperform:ability change:repeating_skillperform:ranks change:repeating_skillperform:misc change:repeating_skillperform:bonus change:repeating_skillperform:armor_penalty", (e) => {
		var skillid = e.sourceAttribute.substring(0, 43);
		pfom.update_skill(skillid,e.sourceAttribute);
	});
	on("change:profession_classkill change:profession_ability change:profession_ranks change:profession_misc change:profession_bonus change:profession_armor_penalty", (e) => {
		pfom.update_skill("profession",e.sourceAttribute);
	});
	on("change:repeating_skillprofession:classkill change:repeating_skillprofession:name change:repeating_skillprofession:ability change:repeating_skillprofession:ranks change:repeating_skillprofession:misc change:repeating_skillprofession:bonus change:repeating_skillprofession:armor_penalty", (e) => {
		pfom.update_skill(e.sourceAttribute.substring(0, 46),e.sourceAttribute);
	});
	on("change:ride_classkill change:ride_ability change:ride_ranks change:ride_misc change:ride_bonus change:ride_armor_penalty", (e) => {
		pfom.update_skill("ride",e.sourceAttribute);
	});
	on("change:sense_motive_classkill change:sense_motive_ability change:sense_motive_ranks change:sense_motive_misc change:sense_motive_bonus change:sense_motive_armor_penalty", (e) => {
		pfom.update_skill("sense_motive",e.sourceAttribute);
	});
	on("change:sleight_of_hand_classkill change:sleight_of_hand_ability change:sleight_of_hand_ranks change:sleight_of_hand_misc change:sleight_of_hand_bonus change:sleight_of_hand_armor_penalty", (e) => {
		pfom.update_skill("sleight_of_hand",e.sourceAttribute);
	});
	on("change:spellcraft_classkill change:spellcraft_ability change:spellcraft_ranks change:spellcraft_misc change:spellcraft_bonus change:spellcraft_armor_penalty", (e) => {
		pfom.update_skill("spellcraft",e.sourceAttribute);
	});
	on("change:stealth_classkill change:stealth_ability change:stealth_ranks change:stealth_misc change:stealth_bonus change:stealth_armor_penalty", (e) => {
		pfom.update_skill("stealth",e.sourceAttribute);
	});
	on("change:survival_classkill change:survival_ability change:survival_ranks change:survival_misc change:survival_bonus change:survival_armor_penalty", (e) => {
		pfom.update_skill("survival",e.sourceAttribute);
	});
	on("change:swim_classkill change:swim_ability change:swim_ranks change:swim_misc change:swim_bonus change:swim_armor_penalty", (e) => {
		pfom.update_skill("swim",e.sourceAttribute);
	});
	on("change:use_magic_device_classkill change:use_magic_device_ability change:use_magic_device_ranks change:use_magic_device_misc change:use_magic_device_bonus change:use_magic_device_armor_penalty", (e) => {
		pfom.update_skill("use_magic_device",e.sourceAttribute);
	});
	on("change:repeating_skillcustom:classkill change:repeating_skillcustom:name change:repeating_skillcustom:ability change:repeating_skillcustom:ranks change:repeating_skillcustom:misc change:repeating_skillcustom:bonus change:repeating_skillcustom:armor_penalty", (e) => {
		pfom.update_skill(e.sourceAttribute.substring(0, 42),e.sourceAttribute);
	});
	on("change:repeating_skillcraft:classkill change:repeating_skillknowledge:classkill change:repeating_skillknowledge:classkill change:repeating_skillprofession:classkill change:repeating_skillcustom:classkill change:acrobatics_classkill change:appraise_classkill change:bluff_classkill change:climb_classkill change:craft_classkill change:diplomacy_classkill change:disable_device_classkill change:disguise_classkill change:escape_artist_classkill change:fly_classkill change:handle_animal_classkill change:heal_classkill change:intimidate_classkill change:knowledge_arcana_classkill change:knowledge_dungeoneering_classkill change:knowledge_engineering_classkill change:knowledge_geography_classkill change:knowledge_history_classkill change:knowledge_local_classkill change:knowledge_nature_classkill change:knowledge_nobility_classkill change:knowledge_planes_classkill change:knowledge_religion_classkill change:linguistics_classkill change:perception_classkill change:perform_classkill change:profession_classkill change:ride_classkill change:sense_motive_classkill change:sleight_of_hand_classkill change:spellcraft_classkill change:stealth_classkill change:survival_classkill change:swim_classkill change:use_magic_device_classkill", (e) => { // NEW
		let update = {};
		update[e.sourceAttribute + "_flag"] = e.newValue;
		setAttrs(update, {silent: true});
	});
	on("remove:repeating_skillcraft remove:repeating_skillknowledge remove:repeating_skillperform remove:repeating_skillprofession remove:repeating_skillcustom", (e) => {
		pfom.update_skills_ranks();
	});

// =============================================================================
// -----------------------------------------------------------------------------
// # Events : SPELLS and SPELLCASTING
// -----------------------------------------------------------------------------
// =============================================================================

	// === Caster Levels
	on("clicked:caster1_more clicked:caster1_less clicked:caster2_more clicked:caster2_less", (e) => { // NEW
		pfom.switch_caster_level(e.triggerName);
	});

	// === Domains and Schools
	on("change:caster1_domains_schools change:caster2_domains_schools", (e) => {
		pfom.update_all_domain_school(e.sourceAttribute.charAt(6), e.newValue);
	});

	// === Armor Spell Failure
	on("change:armor_spell_failure change:caster1_spell_failure change:caster2_spell_failure", () => {
		getAttrs(["npc","caster1_flag","caster2_flag"], (v) => {
			if ( (v.npc != "1") && ((v.caster1_flag == "1") || (v.caster2_flag == "1")) ) {
				pfom.update_all_spells("all");
			}
		});
	});

	// === Spell DCs / Concentration
	on("change:caster1_ability change:caster1_level change:caster1_concentration_misc change:caster1_concentration_bonus change:caster2_ability change:caster2_level change:caster2_concentration_misc change:caster2_concentration_bonus", (e) => {
		pfom.update_concentration(e.sourceAttribute); // update_concentration => update_sells_dc => update_all_spells
	});
	on("change:caster1_dc_misc change:caster1_dcbonus_level_0 change:caster1_dcbonus_level_1 change:caster1_dcbonus_level_2 change:caster1_dcbonus_level_3 change:caster1_dcbonus_level_4 change:caster1_dcbonus_level_5 change:caster1_dcbonus_level_6 change:caster1_dcbonus_level_7 change:caster1_dcbonus_level_8 change:caster1_dcbonus_level_9 change:caster2_dc_misc change:caster2_dcbonus_level_0 change:caster2_dcbonus_level_1 change:caster2_dcbonus_level_2 change:caster2_dcbonus_level_3 change:caster2_dcbonus_level_4 change:caster2_dcbonus_level_5 change:caster2_dcbonus_level_6 change:caster2_dcbonus_level_7 change:caster2_dcbonus_level_8 change:caster2_dcbonus_level_9", (e) => {
		pfom.update_spells_dc(e.sourceAttribute);
	});

	// === Spell DCs Updates per Level
	on("change:caster1_dc_level_0 change:caster1_dc_level_1 change:caster1_dc_level_2 change:caster1_dc_level_3 change:caster1_dc_level_4 change:caster1_dc_level_5 change:caster1_dc_level_6 change:caster1_dc_level_7 change:caster1_dc_level_8 change:caster1_dc_level_9 change:caster2_dc_level_0 change:caster2_dc_level_1 change:caster2_dc_level_2 change:caster2_dc_level_3 change:caster2_dc_level_4 change:caster2_dc_level_5 change:caster2_dc_level_6 change:caster2_dc_level_7 change:caster2_dc_level_8 change:caster2_dc_level_9", (e) =>{
		pfom.update_spells(e.sourceAttribute.charAt(e.sourceAttribute.length - 1),"all");
	});

	// === Spell Show Flag per Level
	on("change:caster1_spells_known_level_0 change:caster1_spells_known_level_1 change:caster1_spells_known_level_2 change:caster1_spells_known_level_3 change:caster1_spells_known_level_4 change:caster1_spells_known_level_5 change:caster1_spells_known_level_6 change:caster1_spells_known_level_7 change:caster1_spells_known_level_8 change:caster1_spells_known_level_9 change:caster2_spells_known_level_0 change:caster2_spells_known_level_1 change:caster2_spells_known_level_2 change:caster2_spells_known_level_3 change:caster2_spells_known_level_4 change:caster2_spells_known_level_5 change:caster2_spells_known_level_6 change:caster2_spells_known_level_7 change:caster2_spells_known_level_8 change:caster2_spells_known_level_9 change:caster1_spells_total_level_0 change:caster1_spells_total_level_1 change:caster1_spells_total_level_2 change:caster1_spells_total_level_3 change:caster1_spells_total_level_4 change:caster1_spells_total_level_5 change:caster1_spells_total_level_6 change:caster1_spells_total_level_7 change:caster1_spells_total_level_8 change:caster1_spells_total_level_9 change:caster2_spells_total_level_0 change:caster2_spells_total_level_1 change:caster2_spells_total_level_2 change:caster2_spells_total_level_3 change:caster2_spells_total_level_4 change:caster2_spells_total_level_5 change:caster2_spells_total_level_6 change:caster2_spells_total_level_7 change:caster2_spells_total_level_8 change:caster2_spells_total_level_9", (e) =>{
		pfom.update_spells_flag(e.sourceAttribute.charAt(e.sourceAttribute.length - 1));
	});

	// === Spell Prepared / Spell Total
	on("change:caster1_spells_perday_level_0 change:caster1_spells_perday_level_1 change:caster1_spells_perday_level_2 change:caster1_spells_perday_level_3 change:caster1_spells_perday_level_4 change:caster1_spells_perday_level_5 change:caster1_spells_perday_level_6 change:caster1_spells_perday_level_7 change:caster1_spells_perday_level_8 change:caster1_spells_perday_level_9 change:caster1_spells_bonus_level_0 change:caster1_spells_bonus_level_1 change:caster1_spells_bonus_level_2 change:caster1_spells_bonus_level_3 change:caster1_spells_bonus_level_4 change:caster1_spells_bonus_level_5 change:caster1_spells_bonus_level_6 change:caster1_spells_bonus_level_7 change:caster1_spells_bonus_level_8 change:caster1_spells_bonus_level_9", (e) => {
		pfom.update_spells_totals(e.sourceAttribute.charAt(e.sourceAttribute.length - 1),1);
	});
	on("change:caster2_spells_perday_level_0 change:caster2_spells_perday_level_1 change:caster2_spells_perday_level_2 change:caster2_spells_perday_level_3 change:caster2_spells_perday_level_4 change:caster2_spells_perday_level_5 change:caster2_spells_perday_level_6 change:caster2_spells_perday_level_7 change:caster2_spells_perday_level_8 change:caster2_spells_perday_level_9 change:caster2_spells_bonus_level_0 change:caster2_spells_bonus_level_1 change:caster2_spells_bonus_level_2 change:caster2_spells_bonus_level_3 change:caster2_spells_bonus_level_4 change:caster2_spells_bonus_level_5 change:caster2_spells_bonus_level_6 change:caster2_spells_bonus_level_7 change:caster2_spells_bonus_level_8 change:caster2_spells_bonus_level_9", (e) => {
		pfom.update_spells_totals(e.sourceAttribute.charAt(e.sourceAttribute.length - 1),2);
	});
	on("change:repeating_spell-0:spellprepared change:repeating_spell-1:spellprepared change:repeating_spell-2:spellprepared change:repeating_spell-3:spellprepared change:repeating_spell-4:spellprepared change:repeating_spell-5:spellprepared change:repeating_spell-6:spellprepared change:repeating_spell-7:spellprepared change:repeating_spell-8:spellprepared change:repeating_spell-9:spellprepared", (e) => {
		pfom.update_spells_prepared(e.sourceAttribute);
	});

	// === Spells Known
	on("change:caster1_mp_known_level_0 change:caster1_mp_known_bonus_level_0 change:caster1_mp_known_level_1 change:caster1_mp_known_bonus_level_1 change:caster1_mp_known_level_2 change:caster1_mp_known_bonus_level_2 change:caster1_mp_known_level_3 change:caster1_mp_known_bonus_level_3 change:caster1_mp_known_level_4 change:caster1_mp_known_bonus_level_4 change:caster1_mp_known_level_5 change:caster1_mp_known_bonus_level_5 change:caster1_mp_known_level_6 change:caster1_mp_known_bonus_level_6 change:caster1_mp_known_level_7 change:caster1_mp_known_bonus_level_7 change:caster1_mp_known_level_8 change:caster1_mp_known_bonus_level_8 change:caster1_mp_known_level_9 change:caster1_mp_known_bonus_level_9 change:caster2_mp_known_level_0 change:caster2_mp_known_bonus_level_0 change:caster2_mp_known_level_1 change:caster2_mp_known_bonus_level_1 change:caster2_mp_known_level_2 change:caster2_mp_known_bonus_level_2 change:caster2_mp_known_level_3 change:caster2_mp_known_bonus_level_3 change:caster2_mp_known_level_4 change:caster2_mp_known_bonus_level_4 change:caster2_mp_known_level_5 change:caster2_mp_known_bonus_level_5 change:caster2_mp_known_level_6 change:caster2_mp_known_bonus_level_6 change:caster2_mp_known_level_7 change:caster2_mp_known_bonus_level_7 change:caster2_mp_known_level_8 change:caster2_mp_known_bonus_level_8 change:caster2_mp_known_level_9 change:caster2_mp_known_bonus_level_9", (e) => {
		pfom.update_spells_known(e.sourceAttribute);
	});

	// === Spell Cost
	on("change:caster1_mp_cost_level_0 change:caster1_mp_cost_level_1 change:caster1_mp_cost_level_2 change:caster1_mp_cost_level_3 change:caster1_mp_cost_level_4 change:caster1_mp_cost_level_5 change:caster1_mp_cost_level_6 change:caster1_mp_cost_level_7 change:caster1_mp_cost_level_8 change:caster1_mp_cost_level_9 change:caster2_mp_cost_level_0 change:caster2_mp_cost_level_1 change:caster2_mp_cost_level_2 change:caster2_mp_cost_level_3 change:caster2_mp_cost_level_4 change:caster2_mp_cost_level_5 change:caster2_mp_cost_level_6 change:caster2_mp_cost_level_7 change:caster2_mp_cost_level_8 change:caster2_mp_cost_level_9", (e) => { // NEW
		pfom.update_spell_cost(e.sourceAttribute.slice(-1));
	});
	on("change:repeating_spell-0:spellcaster change:repeating_spell-1:spellcaster change:repeating_spell-2:spellcaster change:repeating_spell-3:spellcaster change:repeating_spell-4:spellcaster change:repeating_spell-5:spellcaster change:repeating_spell-6:spellcaster change:repeating_spell-7:spellcaster change:repeating_spell-8:spellcaster change:repeating_spell-9:spellcaster", (e) => { // NEW
		pfom.update_spell_cost(e.sourceAttribute.substr(16,1));
	});
	on("change:repeating_spell-0:spellschoolflag change:repeating_spell-1:spellschoolflag change:repeating_spell-2:spellschoolflag change:repeating_spell-3:spellschoolflag change:repeating_spell-4:spellschoolflag change:repeating_spell-5:spellschoolflag change:repeating_spell-6:spellschoolflag change:repeating_spell-7:spellschoolflag change:repeating_spell-8:spellschoolflag change:repeating_spell-9:spellschoolflag", (e) => { // NEW
		let upd = {};
		upd[e.sourceAttribute + "_flag"] = e.newValue;
		setAttrs(upd, {silent: true});
		pfom.update_spell_cost(e.sourceAttribute.substr(16,1));
	});

	// === Magic Points
	on("change:mp_max_base change:mp_temp", () => { // NEW
		pfom.update_mp();
	});
	on("change:spend_mp", (e) => { // NEW
		pfom.update_all_spell_spend_mp();
	});
	on("change:repeating_spell-0:spelldomainflag change:repeating_spell-1:spelldomainflag change:repeating_spell-2:spelldomainflag change:repeating_spell-3:spelldomainflag change:repeating_spell-4:spelldomainflag change:repeating_spell-5:spelldomainflag change:repeating_spell-6:spelldomainflag change:repeating_spell-7:spelldomainflag change:repeating_spell-8:spelldomainflag change:repeating_spell-9:spelldomainflag", (e) => { // NEW
		let lvl = e.sourceAttribute.substr(16,1), id = e.sourceAttribute.substr(18,20);
		pfom.update_spell_spend_mp_id(lvl, id);
		if (e.newValue == "1") { // reset spell prepared
			let update = {};
			update[`repeating_spell-${lvl}_${id}_spellprepared`] = 0;
			setAttrs(update, {silent: true});
		}
	});

	// === Spell Removing
	on("remove:repeating_spell-0 remove:repeating_spell-1 remove:repeating_spell-2 remove:repeating_spell-3 remove:repeating_spell-4 remove:repeating_spell-5 remove:repeating_spell-6 remove:repeating_spell-7 remove:repeating_spell-8 remove:repeating_spell-9", (e) => {
		pfom.update_spells_prepared(e.sourceAttribute);
	});

	// === Spell Rolls / Spell Display
	on("change:repeating_spell-0:spellcaster change:repeating_spell-0:spellname change:repeating_spell-0:spellschool change:repeating_spell-0:spellclasslevel change:repeating_spell-0:spellcastingtime change:repeating_spell-0:spellcomponent change:repeating_spell-0:spellrange change:repeating_spell-0:spellarea change:repeating_spell-0:spelltargets change:repeating_spell-0:spelleffect change:repeating_spell-0:spellduration change:repeating_spell-0:spellsaveflag change:repeating_spell-0:spellsave change:repeating_spell-0:spelldc_mod change:repeating_spell-0:spellresistanceflag change:repeating_spell-0:spellresistance change:repeating_spell-0:spellatkflag change:repeating_spell-0:spellatktype change:repeating_spell-0:spellatkmod change:repeating_spell-0:spellatkcritrange change:repeating_spell-0:spelldmgcritmulti change:repeating_spell-0:spelldmgflag change:repeating_spell-0:spelldmg change:repeating_spell-0:spelldmgtype change:repeating_spell-0:spelldmg2flag change:repeating_spell-0:spelldmg2name change:repeating_spell-0:spelldmg2 change:repeating_spell-0:spelldmg2type change:repeating_spell-0:spelldescflag change:repeating_spell-0:spelldesc change:repeating_spell-0:notes change:repeating_spell-0:spellschoolflag", (e) => {
		pfom.update_spells(0,e.sourceAttribute.substring(18, 38));
	});
	on("change:repeating_spell-1:spellcaster change:repeating_spell-1:spellname change:repeating_spell-1:spellschool change:repeating_spell-1:spellclasslevel change:repeating_spell-1:spellcastingtime change:repeating_spell-1:spellcomponent change:repeating_spell-1:spellrange change:repeating_spell-1:spellarea change:repeating_spell-1:spelltargets change:repeating_spell-1:spelleffect change:repeating_spell-1:spellduration change:repeating_spell-1:spellsaveflag change:repeating_spell-1:spellsave change:repeating_spell-1:spelldc_mod change:repeating_spell-1:spellresistanceflag change:repeating_spell-1:spellresistance change:repeating_spell-1:spellatkflag change:repeating_spell-1:spellatktype change:repeating_spell-1:spellatkmod change:repeating_spell-1:spellatkcritrange change:repeating_spell-1:spelldmgcritmulti change:repeating_spell-1:spelldmgflag change:repeating_spell-1:spelldmg change:repeating_spell-1:spelldmgtype change:repeating_spell-1:spelldmg2flag change:repeating_spell-1:spelldmg2name change:repeating_spell-1:spelldmg2 change:repeating_spell-1:spelldmg2type change:repeating_spell-1:spelldescflag change:repeating_spell-1:spelldesc change:repeating_spell-1:notes change:repeating_spell-1:spelldomainflag change:repeating_spell-1:spelldomain change:repeating_spell-1:spellschoolflag", (e) => {
		pfom.update_spells(1,e.sourceAttribute.substring(18, 38));
	});
	on("change:repeating_spell-2:spellcaster change:repeating_spell-2:spellname change:repeating_spell-2:spellschool change:repeating_spell-2:spellclasslevel change:repeating_spell-2:spellcastingtime change:repeating_spell-2:spellcomponent change:repeating_spell-2:spellrange change:repeating_spell-2:spellarea change:repeating_spell-2:spelltargets change:repeating_spell-2:spelleffect change:repeating_spell-2:spellduration change:repeating_spell-2:spellsaveflag change:repeating_spell-2:spellsave change:repeating_spell-2:spelldc_mod change:repeating_spell-2:spellresistanceflag change:repeating_spell-2:spellresistance change:repeating_spell-2:spellatkflag change:repeating_spell-2:spellatktype change:repeating_spell-2:spellatkmod change:repeating_spell-2:spellatkcritrange change:repeating_spell-2:spelldmgcritmulti change:repeating_spell-2:spelldmgflag change:repeating_spell-2:spelldmg change:repeating_spell-2:spelldmgtype change:repeating_spell-2:spelldmg2flag change:repeating_spell-2:spelldmg2name change:repeating_spell-2:spelldmg2 change:repeating_spell-2:spelldmg2type change:repeating_spell-2:spelldescflag change:repeating_spell-2:spelldesc change:repeating_spell-2:notes change:repeating_spell-2:spelldomainflag change:repeating_spell-2:spelldomain change:repeating_spell-2:spellschoolflag", (e) => {
		pfom.update_spells(2,e.sourceAttribute.substring(18, 38));
	});
	on("change:repeating_spell-3:spellcaster change:repeating_spell-3:spellname change:repeating_spell-3:spellschool change:repeating_spell-3:spellclasslevel change:repeating_spell-3:spellcastingtime change:repeating_spell-3:spellcomponent change:repeating_spell-3:spellrange change:repeating_spell-3:spellarea change:repeating_spell-3:spelltargets change:repeating_spell-3:spelleffect change:repeating_spell-3:spellduration change:repeating_spell-3:spellsaveflag change:repeating_spell-3:spellsave change:repeating_spell-3:spelldc_mod change:repeating_spell-3:spellresistanceflag change:repeating_spell-3:spellresistance change:repeating_spell-3:spellatkflag change:repeating_spell-3:spellatktype change:repeating_spell-3:spellatkmod change:repeating_spell-3:spellatkcritrange change:repeating_spell-3:spelldmgcritmulti change:repeating_spell-3:spelldmgflag change:repeating_spell-3:spelldmg change:repeating_spell-3:spelldmgtype change:repeating_spell-3:spelldmg2flag change:repeating_spell-3:spelldmg2name change:repeating_spell-3:spelldmg2 change:repeating_spell-3:spelldmg2type change:repeating_spell-3:spelldescflag change:repeating_spell-3:spelldesc change:repeating_spell-3:notes change:repeating_spell-3:spelldomainflag change:repeating_spell-3:spelldomain change:repeating_spell-3:spellschoolflag", (e) => {
		pfom.update_spells(3,e.sourceAttribute.substring(18, 38));
	});
	on("change:repeating_spell-4:spellcaster change:repeating_spell-4:spellname change:repeating_spell-4:spellschool change:repeating_spell-4:spellclasslevel change:repeating_spell-4:spellcastingtime change:repeating_spell-4:spellcomponent change:repeating_spell-4:spellrange change:repeating_spell-4:spellarea change:repeating_spell-4:spelltargets change:repeating_spell-4:spelleffect change:repeating_spell-4:spellduration change:repeating_spell-4:spellsaveflag change:repeating_spell-4:spellsave change:repeating_spell-4:spelldc_mod change:repeating_spell-4:spellresistanceflag change:repeating_spell-4:spellresistance change:repeating_spell-4:spellatkflag change:repeating_spell-4:spellatktype change:repeating_spell-4:spellatkmod change:repeating_spell-4:spellatkcritrange change:repeating_spell-4:spelldmgcritmulti change:repeating_spell-4:spelldmgflag change:repeating_spell-4:spelldmg change:repeating_spell-4:spelldmgtype change:repeating_spell-4:spelldmg2flag change:repeating_spell-4:spelldmg2name change:repeating_spell-4:spelldmg2 change:repeating_spell-4:spelldmg2type change:repeating_spell-4:spelldescflag change:repeating_spell-4:spelldesc change:repeating_spell-4:notes change:repeating_spell-4:spelldomainflag change:repeating_spell-4:spelldomain change:repeating_spell-4:spellschoolflag", (e) => {
		pfom.update_spells(4,e.sourceAttribute.substring(18, 38));
	});
	on("change:repeating_spell-5:spellcaster change:repeating_spell-5:spellname change:repeating_spell-5:spellschool change:repeating_spell-5:spellclasslevel change:repeating_spell-5:spellcastingtime change:repeating_spell-5:spellcomponent change:repeating_spell-5:spellrange change:repeating_spell-5:spellarea change:repeating_spell-5:spelltargets change:repeating_spell-5:spelleffect change:repeating_spell-5:spellduration change:repeating_spell-5:spellsaveflag change:repeating_spell-5:spellsave change:repeating_spell-5:spelldc_mod change:repeating_spell-5:spellresistanceflag change:repeating_spell-5:spellresistance change:repeating_spell-5:spellatkflag change:repeating_spell-5:spellatktype change:repeating_spell-5:spellatkmod change:repeating_spell-5:spellatkcritrange change:repeating_spell-5:spelldmgcritmulti change:repeating_spell-5:spelldmgflag change:repeating_spell-5:spelldmg change:repeating_spell-5:spelldmgtype change:repeating_spell-5:spelldmg2flag change:repeating_spell-5:spelldmg2name change:repeating_spell-5:spelldmg2 change:repeating_spell-5:spelldmg2type change:repeating_spell-5:spelldescflag change:repeating_spell-5:spelldesc change:repeating_spell-5:notes change:repeating_spell-5:spelldomainflag change:repeating_spell-5:spelldomain change:repeating_spell-5:spellschoolflag", (e) => {
		pfom.update_spells(5,e.sourceAttribute.substring(18, 38));
	});
	on("change:repeating_spell-6:spellcaster change:repeating_spell-6:spellname change:repeating_spell-6:spellschool change:repeating_spell-6:spellclasslevel change:repeating_spell-6:spellcastingtime change:repeating_spell-6:spellcomponent change:repeating_spell-6:spellrange change:repeating_spell-6:spellarea change:repeating_spell-6:spelltargets change:repeating_spell-6:spelleffect change:repeating_spell-6:spellduration change:repeating_spell-6:spellsaveflag change:repeating_spell-6:spellsave change:repeating_spell-6:spelldc_mod change:repeating_spell-6:spellresistanceflag change:repeating_spell-6:spellresistance change:repeating_spell-6:spellatkflag change:repeating_spell-6:spellatktype change:repeating_spell-6:spellatkmod change:repeating_spell-6:spellatkcritrange change:repeating_spell-6:spelldmgcritmulti change:repeating_spell-6:spelldmgflag change:repeating_spell-6:spelldmg change:repeating_spell-6:spelldmgtype change:repeating_spell-6:spelldmg2flag change:repeating_spell-6:spelldmg2name change:repeating_spell-6:spelldmg2 change:repeating_spell-6:spelldmg2type change:repeating_spell-6:spelldescflag change:repeating_spell-6:spelldesc change:repeating_spell-6:notes change:repeating_spell-6:spelldomainflag change:repeating_spell-6:spelldomain change:repeating_spell-6:spellschoolflag", (e) => {
		pfom.update_spells(6,e.sourceAttribute.substring(18, 38));
	});
	on("change:repeating_spell-7:spellcaster change:repeating_spell-7:spellname change:repeating_spell-7:spellschool change:repeating_spell-7:spellclasslevel change:repeating_spell-7:spellcastingtime change:repeating_spell-7:spellcomponent change:repeating_spell-7:spellrange change:repeating_spell-7:spellarea change:repeating_spell-7:spelltargets change:repeating_spell-7:spelleffect change:repeating_spell-7:spellduration change:repeating_spell-7:spellsaveflag change:repeating_spell-7:spellsave change:repeating_spell-7:spelldc_mod change:repeating_spell-7:spellresistanceflag change:repeating_spell-7:spellresistance change:repeating_spell-7:spellatkflag change:repeating_spell-7:spellatktype change:repeating_spell-7:spellatkmod change:repeating_spell-7:spellatkcritrange change:repeating_spell-7:spelldmgcritmulti change:repeating_spell-7:spelldmgflag change:repeating_spell-7:spelldmg change:repeating_spell-7:spelldmgtype change:repeating_spell-7:spelldmg2flag change:repeating_spell-7:spelldmg2name change:repeating_spell-7:spelldmg2 change:repeating_spell-7:spelldmg2type change:repeating_spell-7:spelldescflag change:repeating_spell-7:spelldesc change:repeating_spell-7:notes change:repeating_spell-7:spelldomainflag change:repeating_spell-7:spelldomain change:repeating_spell-7:spellschoolflag", (e) => {
		pfom.update_spells(7,e.sourceAttribute.substring(18, 38));
	});
	on("change:repeating_spell-8:spellcaster change:repeating_spell-8:spellname change:repeating_spell-8:spellschool change:repeating_spell-8:spellclasslevel change:repeating_spell-8:spellcastingtime change:repeating_spell-8:spellcomponent change:repeating_spell-8:spellrange change:repeating_spell-8:spellarea change:repeating_spell-8:spelltargets change:repeating_spell-8:spelleffect change:repeating_spell-8:spellduration change:repeating_spell-8:spellsaveflag change:repeating_spell-8:spellsave change:repeating_spell-8:spelldc_mod change:repeating_spell-8:spellresistanceflag change:repeating_spell-8:spellresistance change:repeating_spell-8:spellatkflag change:repeating_spell-8:spellatktype change:repeating_spell-8:spellatkmod change:repeating_spell-8:spellatkcritrange change:repeating_spell-8:spelldmgcritmulti change:repeating_spell-8:spelldmgflag change:repeating_spell-8:spelldmg change:repeating_spell-8:spelldmgtype change:repeating_spell-8:spelldmg2flag change:repeating_spell-8:spelldmg2name change:repeating_spell-8:spelldmg2 change:repeating_spell-8:spelldmg2type change:repeating_spell-8:spelldescflag change:repeating_spell-8:spelldesc change:repeating_spell-8:notes change:repeating_spell-8:spelldomainflag change:repeating_spell-8:spelldomain change:repeating_spell-8:spellschoolflag", (e) => {
		pfom.update_spells(8,e.sourceAttribute.substring(18, 38));
	});
	on("change:repeating_spell-9:spellcaster change:repeating_spell-9:spellname change:repeating_spell-9:spellschool change:repeating_spell-9:spellclasslevel change:repeating_spell-9:spellcastingtime change:repeating_spell-9:spellcomponent change:repeating_spell-9:spellrange change:repeating_spell-9:spellarea change:repeating_spell-9:spelltargets change:repeating_spell-9:spelleffect change:repeating_spell-9:spellduration change:repeating_spell-9:spellsaveflag change:repeating_spell-9:spellsave change:repeating_spell-9:spelldc_mod change:repeating_spell-9:spellresistanceflag change:repeating_spell-9:spellresistance change:repeating_spell-9:spellatkflag change:repeating_spell-9:spellatktype change:repeating_spell-9:spellatkmod change:repeating_spell-9:spellatkcritrange change:repeating_spell-9:spelldmgcritmulti change:repeating_spell-9:spelldmgflag change:repeating_spell-9:spelldmg change:repeating_spell-9:spelldmgtype change:repeating_spell-9:spelldmg2flag change:repeating_spell-9:spelldmg2name change:repeating_spell-9:spelldmg2 change:repeating_spell-9:spelldmg2type change:repeating_spell-9:spelldescflag change:repeating_spell-9:spelldesc change:repeating_spell-9:notes change:repeating_spell-9:spelldomainflag change:repeating_spell-9:spelldomain change:repeating_spell-9:spellschoolflag", (e) => {
		pfom.update_spells(9,e.sourceAttribute.substring(18, 38));
	});

	// === Spell-like Abilities
	on("change:repeating_spell-like:spellname change:repeating_spell-like:spelltype change:repeating_spell-like:spellschool change:repeating_spell-like:spellclasslevel change:repeating_spell-like:spellcastingtime change:repeating_spell-like:spellrange change:repeating_spell-like:spellarea change:repeating_spell-like:spelltargets change:repeating_spell-like:spelleffect change:repeating_spell-like:spellduration change:repeating_spell-like:spellsaveflag change:repeating_spell-like:spellsave change:repeating_spell-like:spelldc_mod change:repeating_spell-like:spellresistanceflag change:repeating_spell-like:spellresistance change:repeating_spell-like:spellatkflag change:repeating_spell-like:spellatktype change:repeating_spell-like:spellatkmod change:repeating_spell-like:spellatkcritrange change:repeating_spell-like:spelldmgcritmulti change:repeating_spell-like:spelldmgflag change:repeating_spell-like:spelldmg change:repeating_spell-like:spelldmgtype change:repeating_spell-like:spelldmg2flag change:repeating_spell-like:spelldmg2name change:repeating_spell-like:spelldmg2 change:repeating_spell-like:spelldmg2type change:repeating_spell-like:spelldescflag change:repeating_spell-like:spelldesc change:repeating_spell-like:notes change:repeating_spell-like:timesperday change:repeating_spell-like:perday_max change:repeating_spell-like:perday_qty", (e) => {
		pfom.update_spells("like",e.sourceAttribute.substring(21, 41));
	});

// =============================================================================
// -----------------------------------------------------------------------------
// # Events : CONDITIONS and BUFFS
// -----------------------------------------------------------------------------
// =============================================================================

	// === Conditions
	on("change:condition_bleed change:condition_blinded change:condition_confused change:condition_cowering change:condition_dazed change:condition_dazzled change:condition_deafened change:condition_disabled change:condition_dying change:condition_energy_drained change:condition_entangled change:condition_exhausted change:condition_fascinated change:condition_fatigued change:condition_flat-footed change:condition_frightened change:condition_grappled change:condition_helpless change:condition_incorporeal change:condition_invisible change:condition_nauseated change:condition_panicked change:condition_paralyzed change:condition_petrified change:condition_pinned change:condition_prone change:condition_shaken change:condition_sickened change:condition_stable change:condition_staggered change:condition_stunned change:condition_unconscious ", () => {
		pfom.recalculate("all");
	});
	on("clicked:reset_conditions", () => {
		pfom.recalculate("all",{reset_conditions: true});
	});
	on("change:conditions_display", (e) => {
		if (e.newValue && e.newValue == " ") {
			setAttrs({"conditions_display":""},{silent: true});
		}
	});

	// === Buffs
	on("change:repeating_buff:name change:repeating_buff:toggle change:repeating_buff:mods", (e) => {
		pfom.recalculate("all");
	});
	on("clicked:reset_buffs", () => {
		pfom.recalculate("all",{reset_buffs: true});
	});
	on("change:buffs_display", (e) => {
		if (e.newValue && e.newValue == " ") {
			setAttrs({"buffs_display":""},{silent: true});
		}
	});
	on("clicked:reset_buffs_conditions", () => {
		pfom.recalculate("all",{reset_buffs: true,reset_conditions: true});
	});

// =============================================================================
// -----------------------------------------------------------------------------
// # Events : CONFIGURATION
// -----------------------------------------------------------------------------
// =============================================================================

	on("change:whispertype change:rollshowchar", () => {
		pfom.update_attacks("all");
		pfom.update_all_spells("all");
	 });
	on("change:show_chatsetattr", (e) => { // NEW
		setAttrs({"show_chatsetattr_flag" : e.newValue == "0" ? "0" : "1"});
	});
	on("change:speed_unit_select", (e) => {// NEW
		pfom.update_speed_unit(e);
	});
	on("change:weight_unit", () => {// NEW
		pfom.update_weight_unit();
	});

// =============================================================================
// -----------------------------------------------------------------------------
// # Events : NPC
// -----------------------------------------------------------------------------
// =============================================================================

	on("clicked:npc_confirm", () => {
		pfom.reset_to_xpc(1);
	});
	on("clicked:npc_cancel", () => {
		setAttrs({"npc_confirm_flag": 0});
	});
	on("clicked:npc_to_pc", () => {
		pfom.reset_to_xpc(0);
	});
	on("clicked:pc_to_npc", () => {
		setAttrs({"npc_confirm_flag": 1});
	});

	// === NPC Attacks Display and Roll
	on("change:repeating_npcatk-melee:atkname change:repeating_npcatk-melee:atkmod change:repeating_npcatk-melee:multipleatk_flag change:repeating_npcatk-melee:atkmod2 change:repeating_npcatk-melee:atkmod3 change:repeating_npcatk-melee:atkmod4 change:repeating_npcatk-melee:atkmod5 change:repeating_npcatk-melee:atkmod6 change:repeating_npcatk-melee:atkmod7 change:repeating_npcatk-melee:atkmod8 change:repeating_npcatk-melee:atkmod9 change:repeating_npcatk-melee:atkcritrange change:repeating_npcatk-melee:dmgflag change:repeating_npcatk-melee:dmgbase change:repeating_npcatk-melee:dmgtype change:repeating_npcatk-melee:dmgcritmulti change:repeating_npcatk-melee:dmg2flag change:repeating_npcatk-melee:dmg2base change:repeating_npcatk-melee:dmg2type change:repeating_npcatk-melee:dmg2critmulti", (e) => {
			pfom.update_npc_attack("melee",e.sourceAttribute.substring(23, 43));
	});
	on("change:repeating_npcatk-ranged:atkname change:repeating_npcatk-ranged:atkmod change:repeating_npcatk-ranged:multipleatk_flag change:repeating_npcatk-ranged:atkmod2 change:repeating_npcatk-ranged:atkmod3 change:repeating_npcatk-ranged:atkmod4 change:repeating_npcatk-ranged:atkmod5 change:repeating_npcatk-ranged:atkmod6 change:repeating_npcatk-ranged:atkmod7 change:repeating_npcatk-ranged:atkmod8 change:repeating_npcatk-ranged:atkmod9 change:repeating_npcatk-ranged:atkcritrange change:repeating_npcatk-ranged:atkrange change:repeating_npcatk-ranged:dmgflag change:repeating_npcatk-ranged:dmgbase change:repeating_npcatk-ranged:dmgtype change:repeating_npcatk-ranged:dmgcritmulti change:repeating_npcatk-ranged:dmg2flag change:repeating_npcatk-ranged:dmg2base change:repeating_npcatk-ranged:dmg2type change:repeating_npcatk-ranged:dmg2critmulti", (e) => {
			pfom.update_npc_attack("ranged",e.sourceAttribute.substring(24, 44));
	});

	// === NPC Skills Display
	on("change:acrobatics change:acrobatics_notes change:appraise change:appraise_notes change:bluff change:bluff_notes change:climb change:climb_notes change:craft change:craft_notes change:diplomacy change:diplomacy_notes change:disable_device change:disable_device_notes change:disguise change:disguise_notes change:escape_artist change:escape_artist_notes change:fly change:fly_notes change:handle_animal change:handle_animal_notes change:heal change:heal_notes change:intimidate change:intimidate_notes change:knowledge_arcana change:knowledge_arcana_notes change:knowledge_dungeoneering change:knowledge_dungeoneering_notes change:knowledge_engineering change:knowledge_engineering_notes change:knowledge_geography change:knowledge_geography_notes change:knowledge_history change:knowledge_history_notes change:knowledge_local change:knowledge_local_notes change:knowledge_nature change:knowledge_nature_notes change:knowledge_nobility change:knowledge_nobility_notes change:knowledge_planes change:knowledge_planes_notes change:knowledge_religion change:knowledge_religion_notes change:linguistics change:linguistics_notes change:perception change:perception_notes change:perform change:perform_notes change:profession change:profession_notes change:ride change:ride_notes change:sense_motive change:sense_motive_notes change:sleight_of_hand change:sleight_of_hand_notes change:spellcraft change:spellcraft_notes change:stealth change:stealth_notes change:survival change:survival_notes change:swim change:swim_notes change:use_magic_device change:use_magic_device_notes", (e) => {
		var skill = "";
		if (e.sourceAttribute.slice(-6) == "_notes") {
			skill = e.sourceAttribute.substring(0, e.sourceAttribute.indexOf("_notes"));
		} else {
			skill = e.sourceAttribute;
		}
		var fields = ["npc",skill, skill + "_notes"];
		getAttrs(fields, (v) => {
			if (v.npc == "1") {
				setAttrs(pfom.calc_npc_skill_display(skill,v[skill],v[skill + "_notes"]),{silent: true});
			}
		});
	});

	// === NPC Special Ability Display
	on("change:repeating_abilities:type_choice", (e) => {
		pfom.update_special_ability_display(e.newValue, e.sourceAttribute.substring(0, e.sourceAttribute.indexOf("type")));
	});

	// === NPC Compendium Drops
	on("change:npcdrop_data", (e) => {
		// console.log("*** DEBUG change:npcdrop_data: " + JSON.stringify(e,null,"  "));
		if ((!e.triggerType) || (e.triggerType && e.triggerType == "compendium")) {
			if (e && e.newValue) {
				var cdata;
				try{
					cdata = JSON.parse(e.newValue) || {};
				}
				catch(error){
					cdata = {};
					// console.log("*** DEBUG check_npc_drop: no valid data");
				}
				if (! _.isEmpty(cdata)) {
					// console.log("*** DEBUG check_npc_drop:cdata: " + JSON.stringify(cdata,null,"  "));
					if (cdata["Category"] && (cdata["Category"].toLowerCase() == "bestiary")) {
						setAttrs({"npc": 1,"options_flag_npc": 0,"build_flag_npc": 1},{silent: true}, () => {
							getAttrs(["npcdrop_name","npcdrop_uniq"], (v) => {
								pfom.update_npc_drop(cdata, v, () => {
									pfom.update_default_token();
								});
							});
						});
					}
				} else {
					// console.log("*** DEBUG check_npc_drop: empty data");
				}
			}
		}
	});
	on("change:npcsplike_data", (e) => {
		if (e.newValue) {
			let cdata;
			try{
				cdata = JSON.parse(e.newValue) || {};
			}
			catch(error){
				cdata = {};
			}
			if (! _.isEmpty(cdata)) {
				// console.log("*** DEBUG change:npcsplike_data: " + JSON.stringify(cdata,null,"  "));
				let category = cdata["Category"].toLowerCase();
				if (category == "spells") {
					getAttrs(["npcsplike_name","npcsplike_uniq","npcsplike_content"], (v) => {
						let objs = [];
						let obj = {};
						let page = {};
						let pages = [];
						let update = {};
						let tmpupd = {};

						obj["Name"] = v.npcsplike_name;
						obj["Frequency"] = "At Will";
						obj["Spell"] = v.npcsplike_name;
						obj["spellcaster"] = "2";
						objs.push(obj);

						page["name"] = v.npcsplike_name;
						page["id"] = v.npcsplike_uniq;
						page["content"] = (v.npcsplike_content || "");
						page["data"] = cdata;
						pages.push(page);

						update["npcsplike_name"] = "";
						update["npcsplike_uniq"] = "";
						update["npcsplike_category"] = "";
						update["npcsplike_data"] = "";

						tmpupd = pfom.drop_add_spellike(objs,pages,{},false);
						_.extend(update,tmpupd);

						let spellid = Object.keys(tmpupd)[0].substring(21, 41);
						// console.log("*** DEBUG change:npcsplike_data spellid: " + spellid);

						setAttrs(update,{silent: true},() => {
							pfom.update_spells("like",spellid);
						});
					});
				}
			}
		}
	});
	on("change:npcspl0_data change:npcspl1_data change:npcspl2_data change:npcspl3_data change:npcspl4_data change:npcspl5_data change:npcspl6_data change:npcspl7_data change:npcspl8_data change:npcspl9_data", (e) => {
		if (e.newValue) {
			let cdata;
			try{
				cdata = JSON.parse(e.newValue) || {};
			}
			catch(error){
				cdata = {};
			}
			if (! _.isEmpty(cdata)) {
				// console.log("*** DEBUG change:npcsplX_data: " + JSON.stringify(cdata,null,"  "));
				let category = cdata["Category"].toLowerCase();
				if (category == "spells") {
					let level = e.sourceAttribute.substring(6, 7);
					// console.log("*** DEBUG change:npcsplX_data level: " + level);
					getAttrs([`npcspl${level}_name`,`npcspl${level}_uniq`,`npcspl${level}_content`], (v) => {
						let objs = [];
						let obj = {};
						let page = {};
						let pages = [];
						let update = {};
						let tmpupd = {};

						obj["name"] = v[`npcspl${level}_name`];
						obj["level"] = level;
						obj["spellcaster"] = "1";
						objs.push(obj);

						page["name"] = v[`npcspl${level}_name`];
						page["id"] = v[`npcspl${level}_uniq`];
						page["data"] = cdata;
						page["content"] = (v[`npcspl${level}_content`] || "");
						pages.push(page);

						update[`npcspl${level}_name`] = "";
						update[`npcspl${level}_uniq`] = "";
						update[`npcspl${level}_category`] = "";
						update[`npcspl${level}_data`] = "";

						tmpupd = pfom.drop_add_spells(objs,pages,{},false);
						_.extend(update,tmpupd);

						let spellid = Object.keys(tmpupd)[0].substring(18, 38);
						// console.log("*** DEBUG change:npcsplX_data spellid: " + spellid);

						setAttrs(update,{silent: true},() => {
							pfom.update_spells(level,spellid);
						});
					});
				}
			}
		}

	});
	on("change:npcfeat_data", (e) => {
		// console.log("*** DEBUG change:npcfeat_data e: " + JSON.stringify(e,null,"  "));
		if (e.newValue) {
			let cdata;
			try{
				cdata = JSON.parse(e.newValue) || {};
			}
			catch(error){
				cdata = {};
			}
			if (! _.isEmpty(cdata)) {
				// console.log("*** DEBUG change:npcfeat_data: " + JSON.stringify(cdata,null,"  "));
				let category = cdata["Category"].toLowerCase();
				if (category == "feats") {
					getAttrs(["npcfeat_name","npcfeat_uniq","npcfeat_content"], (v) => {
						// console.log("*** DEBUG change:npcfeat_data v: " + JSON.stringify(v,null,"  "));
						let objs = [];
						let page = {};
						let pages = [];
						let update = {};
						let tmpupd = {};

						objs.push(v.npcfeat_name);

						page["name"] = v.npcfeat_name;
						page["id"] = v.npcfeat_uniq;
						page["content"] = (v.npcfeat_content || "");
						page["data"] = cdata;
						pages.push(page);

						update["npcfeat_name"] = "";
						update["npcfeat_uniq"] = "";
						update["npcfeat_category"] = "";
						update["npcfeat_data"] = "";

						tmpupd = pfom.drop_add_feats(objs,pages, false);
						_.extend(update,tmpupd);

						// console.log("*** DEBUG change:npcfeat_data update: " + JSON.stringify(update,null,"  "));
						setAttrs(update,{silent: true});
					});
				}
			}
		}
	});

////////////////////////////////////////////////////////////////////////////////
//
//                                   MODULE
//
////////////////////////////////////////////////////////////////////////////////

	var pfom = (function () {

// =============================================================================
// -----------------------------------------------------------------------------
// # Module : VARIABLES
// -----------------------------------------------------------------------------
// =============================================================================

		// === Version
		const pfoglobals_currentversion = 1.303;
		const pfoglobals_currentbuild = "Unofficial FR beta";
		const pfoglobals_currentbuildversion = "1.2.2";
		const pfoglobals_currentversion_obj = { // NEW
				"version" : pfoglobals_currentversion,
				"build" : pfoglobals_currentbuild,
				"build_version" : pfoglobals_currentbuildversion
			};

		// === Translation
		var pfoglobals_i18n_obj = (function () {
			var obj = {};
			obj["strength"] = getTranslationByKey("str-u");
			obj["strength_mod"] = getTranslationByKey("str-u");
			obj["strength_oneandahalf"] = getTranslationByKey("str-two-handed");
			obj["strength_oneandahalf_mod"] = getTranslationByKey("str-two-handed");
			obj["strength_half"] = getTranslationByKey("str-off-hand");
			obj["strength_half_mod"] = getTranslationByKey("str-off-hand");
			obj["dexterity"] = getTranslationByKey("dex-u");
			obj["dexterity_mod"] = getTranslationByKey("dex-u");
			obj["dexterity_oneandahalf"] = getTranslationByKey("dex-two-handed");
			obj["dexterity_oneandahalf_mod"] = getTranslationByKey("dex-two-handed");
			obj["dexterity_half"] = getTranslationByKey("dex-off-hand");
			obj["dexterity_half_mod"] = getTranslationByKey("dex-off-hand");
			obj["constitution"] = getTranslationByKey("con-u");
			obj["constitution_mod"] = getTranslationByKey("con-u");
			obj["intelligence"] = getTranslationByKey("int-u");
			obj["intelligence_mod"] = getTranslationByKey("int-u");
			obj["wisdom"] = getTranslationByKey("wis-u");
			obj["wisdom_mod"] = getTranslationByKey("wis-u");
			obj["charisma"] = getTranslationByKey("cha-u");
			obj["charisma_mod"] = getTranslationByKey("cha-u");
			obj["bab"] = getTranslationByKey("bab-u");
			obj["bab_max"] = getTranslationByKey("bab-u");
			obj["melee"] = getTranslationByKey("melee");
			obj["melee-u"] = getTranslationByKey("melee-u");
			obj["melee_mod"] = getTranslationByKey("melee");
			obj["ranged"] = getTranslationByKey("ranged");
			obj["ranged_mod"] = getTranslationByKey("ranged");
			obj["cmb"] = getTranslationByKey("cmb-u");
			obj["cmb_mod"] = getTranslationByKey("cmb-u");
			obj["fob"] = getTranslationByKey("fob");
			obj["cmd"] = getTranslationByKey("cmd-u");
			obj["ac"] = getTranslationByKey("ac-u");
			obj["touch"] = getTranslationByKey("touch");
			obj["flatfooted"] = getTranslationByKey("flat-footed");
			obj["fftouch"] = getTranslationByKey("ff-touch");
			obj["other"] = getTranslationByKey("other");
			obj["fortitude"] = getTranslationByKey("fort-u");
			obj["reflex"] = getTranslationByKey("ref-u");
			obj["will"] = getTranslationByKey("will-u");
			obj["vs"] = getTranslationByKey("vs");
			obj["0"] = "";
			obj["constant"] = getTranslationByKey("constant");
			obj["at-will"] = getTranslationByKey("at-will");
			obj["per-hour"] = getTranslationByKey("per-hour");
			obj["per-day"] = getTranslationByKey("per-day");
			obj["per-week"] = getTranslationByKey("per-week");
			obj["per-month"] = getTranslationByKey("per-month");
			obj["per-year"] = getTranslationByKey("per-year");
			obj["every-hours"] = getTranslationByKey("every-hours");
			obj["bleed"] = getTranslationByKey("bleed");
			obj["dazed"] = getTranslationByKey("dazed");
			obj["dying"] = getTranslationByKey("dying");
			obj["fascinated"] = getTranslationByKey("fascinated");
			obj["grappled"] = getTranslationByKey("grappled");
			obj["nauseated"] = getTranslationByKey("nauseated");
			obj["pinned"] = getTranslationByKey("pinned");
			obj["stable"] = getTranslationByKey("stable");
			obj["blinded"] = getTranslationByKey("blinded");
			obj["dazzled"] = getTranslationByKey("dazzled");
			obj["energy_drained"] = getTranslationByKey("energy_drained");
			obj["fatigued"] = getTranslationByKey("fatigued");
			obj["helpless"] = getTranslationByKey("helpless");
			obj["panicked"] = getTranslationByKey("panicked");
			obj["prone"] = getTranslationByKey("prone");
			obj["staggered"] = getTranslationByKey("staggered");
			obj["confused"] = getTranslationByKey("confused");
			obj["deafened"] = getTranslationByKey("deafened");
			obj["entangled"] = getTranslationByKey("entangled");
			obj["frightened"] = getTranslationByKey("frightened");
			obj["incorporeal"] = getTranslationByKey("incorporeal");
			obj["paralyzed"] = getTranslationByKey("paralyzed");
			obj["shaken"] = getTranslationByKey("shaken");
			obj["stunned"] = getTranslationByKey("stunned");
			obj["cowering"] = getTranslationByKey("cowering");
			obj["disabled"] = getTranslationByKey("disabled");
			obj["exhausted"] = getTranslationByKey("exhausted");
			obj["flat-footed"] = getTranslationByKey("flat-footed");
			obj["invisible"] = getTranslationByKey("invisible");
			obj["petrified"] = getTranslationByKey("petrified");
			obj["sickened"] = getTranslationByKey("sickened");
			obj["unconscious"] = getTranslationByKey("unconscious");
			obj["ability"] = getTranslationByKey("ability");
			return obj;
		})();

		// === Script
		var pfoglobals_initdone = 0;
		const pfoglobals_abilities = ["strength","dexterity","constitution","intelligence","wisdom","charisma"];
		const pfoglobals_abilities_fields = ["strength_base","strength_race","strength_bonus","strength_condition","dexterity_base","dexterity_race","dexterity_bonus","dexterity_condition","constitution_base","constitution_race","constitution_bonus","intelligence_base","intelligence_race","intelligence_bonus","wisdom_base","wisdom_race","wisdom_bonus","charisma_base","charisma_race","charisma_bonus"];
		const pfoglobals_mods = ["strength_mod","dexterity_mod","constitution_mod","intelligence_mod","wisdom_mod","charisma_mod","strength_base_mod","dexterity_base_mod","constitution_base_mod","intelligence_base_mod","wisdom_base_mod","charisma_base_mod","none_mod"];
		const pfoglobals_flex_abilities = ["fortitude_ability","reflex_ability","will_ability","cmb_ability","melee_ability","ranged_ability","acrobatics_ability","appraise_ability","bluff_ability","climb_ability","craft_ability","diplomacy_ability","disable_device_ability","disguise_ability","escape_artist_ability","fly_ability","handle_animal_ability","heal_ability","intimidate_ability","knowledge_arcana_ability","knowledge_dungeoneering_ability","knowledge_engineering_ability","knowledge_geography_ability","knowledge_history_ability","knowledge_local_ability","knowledge_nature_ability","knowledge_nobility_ability","knowledge_planes_ability","knowledge_religion_ability","linguistics_ability","perception_ability","perform_ability","profession_ability","ride_ability","sense_motive_ability","sleight_of_hand_ability","spellcraft_ability","stealth_ability","survival_ability","swim_ability","use_magic_device_ability","caster1_ability","caster2_ability"];
		const pfoglobals_initiative_fields = ["npc","dexterity_mod","initiative_misc","initiative_bonus"];
		const pfoglobals_ac_ability_fields = ["npc","ac_ability_primary","ac_ability_secondary","ac_condition_nobonus","ac_ability_mod","encumbrance_ability_maximum","ac_ability_maximum","ac_secab_monk"].concat(pfoglobals_mods);
		const pfoglobals_ac_fields = ["npc","ac_bonus","ac_ability_mod","ac_armor","ac_shield","ac_size","ac_misc","ac_touch_items","ac_flatfooted_items","ac_natural_items","ac_deflection_items","ac_dodge_items","ac_armor_bonus","ac_shield_bonus","ac_natural_bonus","ac_deflection_bonus","ac_dodge_bonus","ac_noflatflooted","ac_touchshield","ac_condition","ac_secab_monk","ac_ff_ability_mod"];
		const pfoglobals_save_attr = ["base","ability","ability_mod","misc","bonus"];
		const pfoglobals_save_fields = ["reflex_base","reflex_ability","reflex_ability_mod","reflex_misc","reflex_bonus","fortitude_base","fortitude_ability","fortitude_ability_mod","fortitude_misc","fortitude_bonus","will_base","will_ability","will_ability_mod","will_misc","will_bonus"].concat(pfoglobals_mods);
		const pfoglobals_babs_fields = ["npc","bab","bab_multi","bab_size","cmb_size","cmb_ability","cmb_ability_mod","cmb_misc","cmb_bonus","melee_ability","melee_ability_mod","melee_misc","melee_bonus","ranged_ability","ranged_ability_mod","ranged_misc","ranged_bonus","ac_ability_mod","ac_dodge_bonus","ac_dodge_items","ac_deflection_bonus","ac_deflection_items","cmd_misc","cmd_bonus","cmd_condition","ac_condition_nobonus","class1_name","class2_name","class3_name","class1_bab","class2_bab","class3_bab","class1_level","class2_level","class3_level"].concat(pfoglobals_mods);
		const pfoglobals_skill_list = ["acrobatics","appraise","bluff","climb","craft","diplomacy","disable_device","disguise","escape_artist","fly","handle_animal","heal","intimidate","knowledge_arcana","knowledge_dungeoneering","knowledge_engineering","knowledge_geography","knowledge_history","knowledge_local","knowledge_nature","knowledge_nobility","knowledge_planes","knowledge_religion","linguistics","perception","perform","profession","ride","sense_motive","sleight_of_hand","spellcraft","stealth","survival","swim","use_magic_device"];
		const pfoglobals_skill_attr = ["classkill_flag","classkill","ability","ability_mod","ranks","misc","bonus","armor_penalty","base_mod"]; // EDIT
		const pfoglobals_skill_fields = ["skill_check_penalty","armor_check_penalty","encumbrance_check_penalty"].concat(pfoglobals_mods);
		const pfoglobals_skillranks_fields = ["intelligence_mod","class1_skillranks_misc","class1_skillranks_base","class2_skillranks_misc","class2_skillranks_base","class3_skillranks_misc","class3_skillranks_base","class1_level","class2_level","class3_level"];
		var pfoglobals_repsec_skills = [{section:"skillcraft",attrs:pfoglobals_skill_attr},{section:"skillknowledge",attrs:pfoglobals_skill_attr},{section:"skillperform",attrs:pfoglobals_skill_attr},{section:"skillprofession",attrs:pfoglobals_skill_attr},{section:"skillcustom",attrs:pfoglobals_skill_attr}];
		const pfoglobals_atk_attr = ["atkname","atkflag","atktype","atktype2","atkmod","atkvs","atkrange","atkcritrange","dmgflag","dmgbase","dmgattr","dmgmod","dmgcritmulti","dmgtype","dmgbonusdice","dmg2flag","dmg2name","dmg2base","dmg2attr","dmg2mod","dmg2critmulti","dmg2type","dmg2bonusdice","descflag","atkdesc","notes","atkextra1flag", "atkextra1name", "atkextra1critrange", "atkextra1type", "atkextra1type2", "atkextra1mod", "atkextra1dmgbase", "atkextra1dmgattr", "atkextra1dmgmod", "atkextra1dmgtype", "atkextra1dmgcritmulti", "atkextra2flag", "atkextra2name", "atkextra2critrange", "atkextra2type", "atkextra2type2", "atkextra2mod", "atkextra2dmgbase", "atkextra2dmgattr", "atkextra2dmgmod", "atkextra2dmgtype", "atkextra2dmgcritmulti", "atkextra3flag", "atkextra3name", "atkextra3critrange", "atkextra3type", "atkextra3type2", "atkextra3mod", "atkextra3dmgbase", "atkextra3dmgattr", "atkextra3dmgmod", "atkextra3dmgtype", "atkextra3dmgcritmulti", "atkammo"]; // EDIT
		var pfoglobals_repsec_atk = [{section:"attacks",attrs:pfoglobals_atk_attr}];
		const pfoglobals_atk_fields = ["npc","strength_oneandahalf_mod","strength_half_mod","dexterity_oneandahalf_mod","dexterity_half_mod","melee_mod","ranged_mod","cmb_mod","bab","bab_max","fob","rollnotes_attack","whispertype","rollshowchar","bab_multi","melee_multi","ranged_multi","cmb_multi","fob_multi","attack_bonus","damage_bonus","melee_damage_bonus","ranged_damage_bonus"].concat(pfoglobals_mods); // EDIT
		const pfoglobals_abilities_attr = ["perday","perday_max","perday_qty"];
		const pfoglobals_repsec_traits = [{section:"abilities",attrs:pfoglobals_abilities_attr}];
		const pfoglobals_spell_attr = ["spelllevel","spellcaster","spellname","spellschool","spellclasslevel","spellcastingtime","spellrange","spellarea","spelltargets","spelleffect","spellduration","spellsaveflag","spellsave","spelldc_mod","spellresistanceflag","spellresistance","spellatkflag","spellatktype","spellatkmod","spellatkcritrange","spelldmgcritmulti","spelldmgflag","spelldmg","spelldmgtype","spelldmg2flag","spelldmg2name","spelldmg2","spelldmg2type","spelldescflag","spelldesc","notes"];
		const pfoglobals_spell_only_attr = ["spelldomainflag","spelldomain","spellschoolflag","spellcomponent"]; // EDIT
		const pfoglobals_spell_like_attr = ["spelltype","timesperday","perday_max","perday_qty"];
		var pfoglobals_repsec_spell = [];
		const pfoglobals_spell_fields = ["melee_mod","ranged_mod","cmb_mod","rollnotes_spell","whispertype","rollshowchar","caster1_level", "caster2_level","caster1_flag","caster2_flag","caster1_class","caster2_class","armor_spell_failure","caster1_spell_failure","caster2_spell_failure","npc","caster1_concentration_roll","caster2_concentration_roll","caster1_dc_level_0","caster1_dc_level_1","caster1_dc_level_2","caster1_dc_level_3","caster1_dc_level_4","caster1_dc_level_5","caster1_dc_level_6","caster1_dc_level_7","caster1_dc_level_8","caster1_dc_level_9","caster2_dc_level_0","caster2_dc_level_1","caster2_dc_level_2","caster2_dc_level_3","caster2_dc_level_4","caster2_dc_level_5","caster2_dc_level_6","caster2_dc_level_7","caster2_dc_level_8","caster2_dc_level_9","spend_mp"].concat(pfoglobals_mods); // EDIT
		const pfoglobals_concentration_fields = ["npc","caster1_level","caster1_ability","caster1_ability_mod","caster1_concentration_misc","caster1_concentration_bonus","caster2_level","caster2_ability","caster2_ability_mod","caster2_concentration_misc","caster2_concentration_bonus"].concat(pfoglobals_mods);
		const pfoglobals_spells_dc_fields = ["npc","caster1_ability","caster1_ability_mod","caster1_dc_misc","caster1_dcbonus_level_0","caster1_dcbonus_level_1","caster1_dcbonus_level_2","caster1_dcbonus_level_3","caster1_dcbonus_level_4","caster1_dcbonus_level_5","caster1_dcbonus_level_6","caster1_dcbonus_level_7","caster1_dcbonus_level_8","caster1_dcbonus_level_9","caster2_ability","caster2_ability_mod","caster2_dc_misc","caster2_dcbonus_level_0","caster2_dcbonus_level_1","caster2_dcbonus_level_2","caster2_dcbonus_level_3","caster2_dcbonus_level_4","caster2_dcbonus_level_5","caster2_dcbonus_level_6","caster2_dcbonus_level_7","caster2_dcbonus_level_8","caster2_dcbonus_level_9"].concat(pfoglobals_mods);
		const pfoglobals_size = [{"size":"fine","atkac":8,"cmb":-8,"fly":8,"stealth":16,"load":0.125,"squares":0.5},{"size":"diminutive","atkac":4,"cmb":-4,"fly":6,"stealth":12,"load":0.25,"squares":0.5},{"size":"tiny","atkac":2,"cmb":-2,"fly":4,"stealth":8,"load":0.5,"squares":0.5},{"size":"small","atkac":1,"cmb":-1,"fly":2,"stealth":4,"load":0.75,"squares":0.75},{"size":"medium","atkac":0,"cmb":0,"fly":0,"stealth":0,"load":1,"squares":1.0},{"size":"large","atkac":-1,"cmb":1,"fly":-2,"stealth":-4,"load":2,"squares":2.0},{"size":"huge","atkac":-2,"cmb":2,"fly":-4,"stealth":-8,"load":4,"squares":3.0},{"size":"gargantuan","atkac":-4,"cmb":4,"fly":-6,"stealth":-12,"load":8,"squares":4.0},{"size":"colossal","atkac":-8,"cmb":8,"fly":-8,"stealth":-16,"load":16,"squares":4.0}];
		const pfoglobals_encumbrance_fields = ["npc","speed_unit","speed_race","speed_class","base_run_factor","strength","weight_unit","encumbrance_load_bonus","encumbrance_load_multiplier","encumbrance_size","encumbrance_gear_weight","encumbrance_load_light","encumbrance_load_medium","encumbrance_load_heavy","encumbrance","encumbrance_display"]; // EDIT
		const pfoglobals_speed_fields = ["speed_unit","speed_race","speed_class","encumbrance","speed_notmodified","speed_encumbrance","speed_armor","encumbrance_run_factor","armor_run_factor","speed_base","speed_bonus","speed_run_factor","speed_condition_multiplier","speed_condition_norun","speed_condition_nospeed","speed_climb_misc","speed_climb_bonus","speed_swim_misc","speed_swim_bonus"]; // EDIT
		const pfoglobals_conditions = ["condition_bleed","condition_blinded","condition_confused","condition_cowering","condition_dazed","condition_dazzled","condition_deafened","condition_disabled","condition_dying","condition_energy_drained","condition_entangled","condition_exhausted","condition_fascinated","condition_fatigued","condition_flat-footed","condition_frightened","condition_grappled","condition_helpless","condition_incorporeal","condition_invisible","condition_nauseated","condition_panicked","condition_paralyzed","condition_petrified","condition_pinned","condition_prone","condition_shaken","condition_sickened","condition_stable","condition_staggered","condition_stunned","condition_unconscious"];
		const pfoglobals_buff_attr = ["name","toggle","mods"];
		var pfoglobals_repsec_buff = [{section:"buff",attrs:pfoglobals_buff_attr}];
		const pfoglobals_allrepsecs = ["npcatk-melee","npcatk-ranged","npcatk-special","feats","abilities","buff","attacks","skillcraft","skillknowledge","skillperform","skillprofession","skillcustom","acitems","gear","feats","abilities","spell-0","spell-1","spell-2","spell-3","spell-4","spell-5","spell-6","spell-7","spell-8","spell-9","spell-like","metamagic"];

// =============================================================================
// -----------------------------------------------------------------------------
// # Module : MANCER FINISH
// -----------------------------------------------------------------------------
// =============================================================================

		const mancer_finish = function(eventinfo) {

			// === VARIABLES ===
			// console.log("*** DEBUG Mancer finish: " + JSON.stringify(eventinfo,null,"  "));
			let mncrAbilities = pfoglobals_abilities;
			let mancerdata = eventinfo.data;
			let charUpd = {};
			let bRaceData = false;
			let bClassData = false;
			let FeatsToLoad = [];
			let SpellsToLoad = [];
			let allSpells = [];
			let allTraits = [];
			let allPowers = [];
			let allClassSkills = "";
			let allSkillBonus = "";
			let skillBonusNotes = {};
			let finalRaceSpeed = 0;
			let finalClassSpeed = 0;
			let favoredbonus = 0;

			// === FUNCTIONS ===
			const calc_abilities = function(data) {
				let abilities_scores = {};
				// --- Preparing ability scores detailed array
				_.each(mncrAbilities, (ability) => {
					abilities_scores[ability] = {"total": 0, "base":"0","race":"0","class":"0","subclass":"0","misc":"0"};
				});
				// --- Abilities base
				if (data["l1-abilities"]) {
					_.each(mncrAbilities, (ability) => {
						if (data["l1-abilities"].values[ability]) {
							abilities_scores[ability].base = parseInt(data["l1-abilities"].values[ability]) || 0;
						}
					});
				}
				// --- Abilities race
				if (data["l1-race"]) {
					if (data["l1-race"].data && data["l1-race"].data.race) {
						if (data["l1-race"].data.race["data-Ability Score Modifiers"]) {
							_.each(data["l1-race"].data.race["data-Ability Score Modifiers"].split(","), (modifier) => {
								let abrace = modifier.trim().toLowerCase();
								if (abilities_scores[abrace.split(" ")[0].trim()]) {
									abilities_scores[abrace.split(" ")[0].trim()].race = parseInt(abrace.split(" ")[1]) || 0;
								}
								else {
									console.log("*** DEBUG ERROR ability race unsplitable: " + abrace);
								}
							});
						} else if (data["l1-race"].data.race["data-Ability Score Choice"] && data["l1-race"].values["race_ability_choice1"]) {
							abilities_scores[data["l1-race"].values["race_ability_choice1"]].race = parseInt(data["l1-race"].data.race["data-Ability Score Choice"].split("+")[1]) || 0;
						}
					}
					// --- Custom race abilities bonuses
					if (data["l1-race"].values["race"] == "Index:Races") {
						_.each(mncrAbilities, (ability) => {
							if (data["l1-race"].values["race_" + ability]) {
								abilities_scores[ability].race = data["l1-race"].values["race_" + ability];
							}
						});
					}
				}
				// --- Abilities class
				// --- Abilities subclass
				if (data["l1-class"] && data["l1-class"].values.class_subclass1_ability_choice) {
					var sbclsablt = data["l1-class"].values.class_subclass1_ability_choice.split("(")[0].toLowerCase().trim();
					var sbclsabltvalue = data["l1-class"].values.class_subclass1_ability_choice.split("(")[1].replace(/[^\d\-]/gi, "");
					abilities_scores[sbclsablt].subclass = parseInt(sbclsabltvalue) || 0;
				}
				// --- Abilities misc
				// --- Final abilities calculation
				_.each(mncrAbilities, (ability) => {
					abilities_scores[ability].total = (parseInt(abilities_scores[ability].base) || 0) + (parseInt(abilities_scores[ability].race) || 0) + (parseInt(abilities_scores[ability].class) || 0) + (parseInt(abilities_scores[ability].subclass) || 0) + (parseInt(abilities_scores[ability].misc) || 0);
				});
				return abilities_scores;
			};
			const calc_abilities_mod = function(abilities_scores) {
				let ability_mods = {};
				_.each(mncrAbilities, (ability) => {
					ability_mods[ability] = Math.floor(((parseInt(abilities_scores[ability].total) || 10) - 10) / 2);
				});
				return ability_mods;
			};

			// === INIT ===
			// --- Reset / Initialize
			setCharmancerText({"mancer_category":"Resetting Attributes / Erasing Old Data","mancer_progress" :'<div style="width: 4%"></div>'});
			erase_repsec_ids(JSON.parse(JSON.stringify(pfoglobals_allrepsecs)), () => {
				charUpd = calc_reset_character();
				charUpd["npc"] = 0;
				charUpd["tabcurrent"] = "tabmain";
				charUpd["l1mancer_status"] = "completed";

				// === 1.ABILITIES ===
				setCharmancerText({"mancer_category":"Calculating Abilities","mancer_progress" :'<div style="width: 8%"></div>'});
				let abilities_score = calc_abilities(mancerdata);
				let ability_mods = calc_abilities_mod(abilities_score);
				_.each(mncrAbilities, (ablt) => {
					charUpd[ablt + "_base"] = parseInt(abilities_score[ablt].total) - parseInt(abilities_score[ablt].race);
					charUpd[ablt + "_race"] = parseInt(abilities_score[ablt].race);
					charUpd[ablt + "_mod"] = parseInt(ability_mods[ablt]);
				});

				// === 2.RACE ===
				setCharmancerText({"mancer_category":"Applying Race","mancer_progress" :'<div style="width: 16%"></div>'});
				if (mancerdata["l1-race"] && mancerdata["l1-race"].values.race) {
					// Variables
					if (mancerdata["l1-race"].values.race == "Index:Races") {
						// Custom race
						charUpd["race"] = (mancerdata["l1-race"].values["race_custom_name"] || "Unknown");
						charUpd["size"] = (mancerdata["l1-race"].values["race_custom_size"] || "medium");
						finalRaceSpeed += (parseFloat(mancerdata["l1-race"].values["race_custom_speed"]) || 30); // EDIT
					} else {
						charUpd["race"] = mancerdata["l1-race"].values.race.replace("Races:","");
					}
					// Static data
					if (mancerdata["l1-race"].data && mancerdata["l1-race"].data.race) {
						bRaceData = true;
						// Size
						charUpd["size"] = mancerdata["l1-race"].data.race["data-Size"].toLowerCase().trim();
						// Speed
						if (mancerdata["l1-race"].data.race["data-Race Speed"]) {
							finalRaceSpeed += (parseInt(mancerdata["l1-race"].data.race["data-Race Speed"]) || 0);
						}
						if (mancerdata["l1-race"].data.race["data-Speed Not Modified"]) {
							charUpd["speed_notmodified"] = 1;
						}
						// Senses
						if (mancerdata["l1-race"].data.race["data-Senses"]) {
							charUpd["senses"] = mancerdata["l1-race"].data.race["data-Senses"];
						}
						// Lanuages
						if (mancerdata["l1-race"].data.race["data-Languages"]) {
							charUpd["languages"] += mancerdata["l1-race"].data.race["data-Languages"] + " ";
						}
						// AC notes
						if (mancerdata["l1-race"].data.race["data-AC Notes"]) {
							charUpd["ac_notes"] = mancerdata["l1-race"].data.race["data-AC Notes"];
						}
						// Fortitude notes
						if (mancerdata["l1-race"].data.race["data-Fortitude Notes"]) {
							charUpd["fortitude_notes"] += mancerdata["l1-race"].data.race["data-Fortitude Notes"] + " ";
						}
						// Reflex notes
						if (mancerdata["l1-race"].data.race["data-Reflex Notes"]) {
							charUpd["reflex_notes"] += mancerdata["l1-race"].data.race["data-Reflex Notes"] + " ";
						}
						// Will notes
						if (mancerdata["l1-race"].data.race["data-Will Notes"]) {
							charUpd["will_notes"] += mancerdata["l1-race"].data.race["data-Will Notes"] + " ";
						}
						// Skill notes
						if (mancerdata["l1-race"].data.race["data-Skill Notes"]) {
							if (mancerdata["l1-race"].data.race["data-Skill Notes"].indexOf(":") != -1) {
								charUpd[mancerdata["l1-race"].data.race["data-Skill Notes"].split(":")[0].toLowerCase().trim() + "_notes"] += mancerdata["l1-race"].data.race["data-Skill Notes"].split(":")[1].trim();
							}
						}
						// Skill bonus
						if (mancerdata["l1-race"].data.race["data-Skills Bonus"]) {
							allSkillBonus += mancerdata["l1-race"].data.race["data-Skills Bonus"] + ",";
							if (skillBonusNotes[mancerdata["l1-race"].values.race.replace("Races:","")]) {
								skillBonusNotes[mancerdata["l1-race"].values.race.replace("Races:","")] += mancerdata["l1-race"].data.race["data-Skills Bonus"] + ",";
							} else {
								skillBonusNotes[mancerdata["l1-race"].values.race.replace("Races:","")] = mancerdata["l1-race"].data.race["data-Skills Bonus"] + ",";
							}
						}
						if (mancerdata["l1-race"].values.race_skill_bonus_choice) {
							allSkillBonus += mancerdata["l1-race"].values.race_skill_bonus_choice + ",";
							if (skillBonusNotes[mancerdata["l1-race"].values.race.replace("Races:","")]) {
								skillBonusNotes[mancerdata["l1-race"].values.race.replace("Races:","")] += mancerdata["l1-race"].values.race_skill_bonus_choice + ",";
							} else {
								skillBonusNotes[mancerdata["l1-race"].values.race.replace("Races:","")] = mancerdata["l1-race"].values.race_skill_bonus_choice + ",";
							}
						}
						// Skill Ranks bonus
						if (mancerdata["l1-race"].data.race["data-Skill Ranks Bonus"]) {
							charUpd["class1_skillranks_base"] = (parseInt(charUpd["class1_skillranks_base"]) || 0) + (parseInt(mancerdata["l1-race"].data.race["data-Skill Ranks Bonus"].replace(/[^\d\-]/gi, "")) || 0);
						}
						// Feats
						if (mancerdata["l1-race"].values.race_feat_choice) {
							FeatsToLoad.push(mancerdata["l1-race"].values.race_feat_choice);
						} else if (mancerdata["l1-race"].data.race["data-Feats"]) {
							_.each(mancerdata["l1-race"].data.race["data-Feats"].split(","),(feat) => {
								FeatsToLoad.push("Feats:" + feat.trim());
							});
						}
						// Spell-like abilities
						if (mancerdata["l1-race"].data.race["data-Spell-like abilities"]) {
							let splabz = "";
							if (mancerdata["l1-race"].data.race["data-Spell-like abilities prerequisites"]) {
								let ablt = (mancerdata["l1-race"].data.race["data-Spell-like abilities prerequisites"].split(" ")[0] || "").trim().toLowerCase();
								let minv = parseInt((mancerdata["l1-race"].data.race["data-Spell-like abilities prerequisites"].split(" ")[1] || "").trim().toLowerCase()) || 99;
								if ( (parseInt(abilities_score[ablt].total) || 0) >= minv ) {
									splabz = mancerdata["l1-race"].data.race["data-Spell-like abilities"];
								}
							} else {
								splabz = mancerdata["l1-race"].data.race["data-Spell-like abilities"];
							}
							if (splabz.length) {
								charUpd["caster1_flag"] = 1;
								charUpd["caster_flag"] = 1;
								_.each(splabz.split(","), (splab) => {
									let pawa = {};
									pawa["Name"] = splab.trim();
									pawa["Type"] = "Sp";
									pawa["Spell-like"] = true;
									pawa["Spell-source"] = splab.trim();
									allPowers.push(pawa);
									SpellsToLoad.push("Spells:" + splab.trim());
								});
							}
						}
						// Traits
						if (mancerdata["l1-race"].data.race["data-Traits"]) {
							_.each(mancerdata["l1-race"].data.race["data-Traits"], (trait) => {
								if (! trait["Type"]) {
									trait["Type"] = getTranslationByKey("race");
								}
								allTraits.push(trait);
							});
						}
					}
				}

				// === 3.CLASS ===
				setCharmancerText({"mancer_category":"Applying Class","mancer_progress" :'<div style="width: 24%"></div>'});
				charUpd["level"] = 1;
				charUpd["class1_level"] = 1;
				if (mancerdata["l1-class"] && mancerdata["l1-class"].values.class && mancerdata["l1-class"].values.class!="Rules:Classes") {
					// Variables
					charUpd["class1_name"] = mancerdata["l1-class"].values.class.replace("Classes:","");
					charUpd["class"] = charUpd["class1_name"] + " 1";
					if (mancerdata["l1-class"].values.favored_class && mancerdata["l1-class"].values.favored_class != "0") {
						charUpd["class1_favored"] = 1;
						charUpd["class_favored"] = 1;
						charUpd["class1_skillranks_misc"] = (mancerdata["l1-class"].values.favored_class == "1" ? 1 : 0);
						favoredbonus = (mancerdata["l1-class"].values.favored_class == "2" ? 1 : 0);
					} else {
						charUpd["class1_favored"] = 0;
						charUpd["class_favored"] = 0;
					}
					// Alignment
					if (mancerdata["l1-class"].values.class_alignment_choice) {
						charUpd["alignment"] = mancerdata["l1-class"].values.class_alignment_choice.toLowerCase();
					}
					// Static data
					if (mancerdata["l1-class"].data && mancerdata["l1-class"].data.class) {
						bClassData = true;
						// Hit Die
						if (mancerdata["l1-class"].data.class["data-Hit Die"]) {
							charUpd["class1_hitdietype"] = mancerdata["l1-class"].data.class["data-Hit Die"].toLowerCase().replace("d","");
							charUpd["hitdietype"] = charUpd["class1_hitdietype"];
							charUpd["hp_base"] = (parseInt(charUpd["class1_hitdietype"]) || 0) + (parseInt(ability_mods["constitution"]) || 0) + favoredbonus;
							charUpd["hp_base_max"] = charUpd["hp_base"];
							charUpd["hp"] = charUpd["hp_base"];
							charUpd["hp_max"] = charUpd["hp_base"];
						}
						// Class skills
						if (mancerdata["l1-class"].data.class["data-Class skills"]) {
							allClassSkills += mancerdata["l1-class"].data.class["data-Class skills"] + ",";
						}
						// Skill Bonus
						if (mancerdata["l1-class"].data.class["data-Skills bonus"]) {
							allSkillBonus += mancerdata["l1-class"].data.class["data-Skills bonus"] + ",";
							if (skillBonusNotes[mancerdata["l1-class"].values.class.replace("Classes:","")]) {
								skillBonusNotes[mancerdata["l1-class"].values.class.replace("Classes:","")] += mancerdata["l1-class"].data.class["data-Skills bonus"] + ",";
							} else {
								skillBonusNotes[mancerdata["l1-class"].values.class.replace("Classes:","")] = mancerdata["l1-class"].data.class["data-Skills bonus"] + ",";
							}
						}
						// Skill Ranks
						if (mancerdata["l1-class"].data.class["data-Skill Ranks"]) {
							charUpd["class1_skillranks_base"] = (parseInt(charUpd["class1_skillranks_base"]) || 0) + (parseInt(mancerdata["l1-class"].data.class["data-Skill Ranks"].split("+")[0].replace(/[^\d\-]/gi, "")) || 0);
						}
						// Wealth
						if (mancerdata["l1-class"].values["class_wealth"] && mancerdata["l1-class"].values["class_wealth"] == "starting" && mancerdata["l1-class"].values["class_gp"]) {
							charUpd["money_gp"] = parseInt(mancerdata["l1-class"].values["class_gp"]) || 0;
						} else if (mancerdata["l1-class"].data.class["data-Average Wealth"]) {
							charUpd["money_gp"] = parseInt(mancerdata["l1-class"].data.class["data-Average Wealth"].replace("gp","").trim()) || 0;
						}
						// BAB
						if (mancerdata["l1-class"].data.class["data-Base Attack Bonus"]) {
							charUpd["class1_bab"] = parseInt(mancerdata["l1-class"].data.class["data-Base Attack Bonus"]) || 0;
							charUpd["bab"] = charUpd["class1_bab"];
						}
						// Saves => at saves below
						// Speeb Bonus
						if (mancerdata["l1-class"].data.class["data-Speed bonus"]) {
							finalClassSpeed += (parseInt(mancerdata["l1-class"].data.class["data-Speed bonus"]) || 0);
							charUpd["speed_notes"] += "+" + mancerdata["l1-class"].data.class["data-Speed bonus"] + " (" + charUpd["class1_name"] + ") ";
						}
						// AC Secondary Ability
						if (mancerdata["l1-class"].data.class["data-AC Secondary Ability"]) {
							charUpd["ac_ability_secondary"] = mancerdata["l1-class"].data.class["data-AC Secondary Ability"].toLowerCase();
							// Special cases
							if (charUpd["class1_name"] == "Monk") {
								charUpd["ac_secab_monk"] = 1;
							}
						}
						// Spellcasting
						if (mancerdata["l1-class"].data.class["data-Spellcaster"]) {
							charUpd["caster1_flag"] = 1;
							charUpd["caster_flag"] = 1;
							charUpd["caster1_class"] = charUpd["class1_name"];
							// Spellcaster Level
							if (mancerdata["l1-class"].data.class["data-Spellcaster Level"]) {
								charUpd["caster1_level"] = parseInt(mancerdata["l1-class"].data.class["data-Spellcaster Level"]) || 0;
							} else {
								charUpd["caster1_level"] = 0;
							}
							// Spellcasting ability
							if (mancerdata["l1-class"].data.class["data-Spellcasting ability"]) {
								charUpd["caster1_ability"] = mancerdata["l1-class"].data.class["data-Spellcasting ability"].toLowerCase().trim();
							} else {
								charUpd["caster1_ability"] = "intelligence";
							}
							// Spell failure
							if (mancerdata["l1-class"].data.class["data-Magic Type"]) {
								charUpd["caster1_spell_failure"] = mancerdata["l1-class"].data.class["data-Magic Type"].toLowerCase() == "arcane" ? 1 : 0;
							}
							// Spells Per Day
							if (mancerdata["l1-class"].data.class["data-Spells Per Day"]) {
								let i = -1;
								_.each(mancerdata["l1-class"].data.class["data-Spells Per Day"].split(","),(qty) => {
									i++;
									charUpd["caster1_spells_perday_level_" + i] = parseInt(qty.trim()) || 0;;
									charUpd["caster1_spells_total_level_" + i] = charUpd["caster1_spells_perday_level_" + i];
									charUpd["caster_spells_flag_level_" + i] = 1;
								});
							}
							// Bonus Spells
							let spellablt = parseInt(abilities_score[charUpd["caster1_ability"]].total) || 10;
							if (spellablt > 11 && spellablt < 20) {
								charUpd["caster1_spells_bonus_level_1"] = 1;
							} else if (spellablt > 19) {
								charUpd["caster1_spells_bonus_level_1"] = 2;
							} else {
								charUpd["caster1_spells_bonus_level_1"] = 0;
							}
							charUpd["caster1_spells_total_level_1"] = (parseInt(charUpd["caster1_spells_total_level_1"]) || 0) + parseInt(charUpd["caster1_spells_bonus_level_1"]);
							// Spells known
							if (mancerdata["l1-class"].data.class["data-Spells Known"]) {
								let i = -1;
								_.each(mancerdata["l1-class"].data.class["data-Spells Known"].split(","),(qty) => {
									i++;
									if (qty.indexOf("+") == -1) {
										charUpd["caster1_spells_known_level_" + i] = parseInt(qty.trim()) || 0;
									} else {
										charUpd["caster1_spells_known_level_" + i] = (parseInt(qty.split("+")[0].toLowerCase().trim()) || 0) + (parseInt(ability_mods[qty.split("+")[1].toLowerCase().trim()]) || 0);
									}
									charUpd["caster_spells_flag_level_" + i] = 1;
								});
							}
							// Spell-like abilities
							if (mancerdata["l1-class"].data.class["data-Spell-like abilities"]) {
								_.each(mancerdata["l1-class"].data.class["data-Spell-like abilities"].split(","), (splab) => {
									let pawa = {};
									pawa["Name"] = splab.trim();
									pawa["Type"] = "Sp";
									pawa["Spell-like"] = true;
									pawa["Spell-source"] = splab.trim();
									allPowers.push(pawa);
									SpellsToLoad.push("Spells:" + splab.trim());
								});
							}
						}
						// Languages
						if (mancerdata["l1-class"].data.class["data-Languages"]) {
							charUpd["languages"] += mancerdata["l1-class"].data.class["data-Languages"] + " ";
						}
						// Feats
						if (mancerdata["l1-class"].data.class["data-Bonus Feats"]) {
							_.each(mancerdata["l1-class"].data.class["data-Bonus Feats"].split(","),(feat) => {
								FeatsToLoad.push("Feats:" + feat.trim());
							});
						}
						if (mancerdata["l1-class"].values.class_feat_choice) {
							FeatsToLoad.push(mancerdata["l1-class"].values.class_feat_choice);
						}
						// Traits
						if (mancerdata["l1-class"].data.class["data-Traits"]) {
							allTraits = allTraits.concat(mancerdata["l1-class"].data.class["data-Traits"]);
						}
					}
					// === SUBCLASS(ES)
					let subcls = 0;
					for (subcls = 1; subcls < 3; subcls++) {
						if (mancerdata["l1-class"].values["class_subclass" + subcls]) {
							charUpd["caster1_spells_notes"] += mancerdata["l1-class"].data.class["data-Subclass Name"] + ": " + mancerdata["l1-class"].values["class_subclass" + subcls].replace("Subclasses:","") + ", ";
							if (mancerdata["l1-class"].data["class_subclass" + subcls]) {
								// Ability bonus
								if (mancerdata["l1-class"].data["class_subclass" + subcls]["data-Ability bonus choice"]) {
									// Nothing to do. Already calculated.
								}
								//Saving Throw bonus
								if (mancerdata["l1-class"].data["class_subclass" + subcls]["data-Saving Throws bonus"]) {
									charUpd["fortitude_notes"] += mancerdata["l1-class"].data["class_subclass" + subcls]["data-Saving Throws bonus"] + " (" + mancerdata["l1-class"].data.class["data-Subclass Name"] + ": " + mancerdata["l1-class"].values["class_subclass" + subcls].replace("Subclasses:","") + "). ";
									charUpd["reflex_notes"] += charUpd["fortitude_notes"];
									charUpd["will_notes"] += charUpd["fortitude_notes"];
								}
								// Initiative bonus
								if (mancerdata["l1-class"].data["class_subclass" + subcls]["data-Initiative Bonus"]) {
									charUpd["initiative_misc"] += (parseInt(charUpd["initiative_misc"]) || 0) + (parseInt(mancerdata["l1-class"].data["class_subclass" + subcls]["data-Initiative Bonus"]) || 0);
									charUpd["initiative_notes"] += "+" + mancerdata["l1-class"].data["class_subclass" + subcls]["data-Initiative Bonus"] + " (" + mancerdata["l1-class"].data.class["data-Subclass Name"] + ": " + mancerdata["l1-class"].values["class_subclass" + subcls].replace("Subclasses:","") + "). ";
								}
								// Speed Bonus // => speed notes
								if (mancerdata["l1-class"].data["class_subclass" + subcls]["data-Base Speed Bonus"]) {
									finalClassSpeed += (parseInt(mancerdata["l1-class"].data["class_subclass" + subcls]["data-Base Speed Bonus"]) || 0);
									charUpd["speed_notes"] += "+" + mancerdata["l1-class"].data["class_subclass" + subcls]["data-Base Speed Bonus"] + " (" + mancerdata["l1-class"].data.class["data-Subclass Name"] + ": " + mancerdata["l1-class"].values["class_subclass" + subcls].replace("Subclasses:","") + ") ";
								}
								// Class skills
								if (mancerdata["l1-class"].data["class_subclass" + subcls]["data-Class skills"]) {
									allClassSkills += mancerdata["l1-class"].data["class_subclass" + subcls]["data-Class skills"] + ",";
								}
								// Skill bonus
								if (mancerdata["l1-class"].data["class_subclass" + subcls]["data-Skills bonus"]) {
									allSkillBonus += mancerdata["l1-class"].data["class_subclass" + subcls]["data-Skills bonus"] + ",";
									if (skillBonusNotes[mancerdata["l1-class"].data.class["data-Subclass Name"] + ": " + mancerdata["l1-class"].values["class_subclass" + subcls].replace("Subclasses:","")]) {
										skillBonusNotes[mancerdata["l1-class"].data.class["data-Subclass Name"] + ": " + mancerdata["l1-class"].values["class_subclass" + subcls].replace("Subclasses:","")] += mancerdata["l1-class"].data["class_subclass" + subcls]["data-Skills bonus"] + ",";
									} else {
										skillBonusNotes[mancerdata["l1-class"].data.class["data-Subclass Name"] + ": " + mancerdata["l1-class"].values["class_subclass" + subcls].replace("Subclasses:","")] = mancerdata["l1-class"].data["class_subclass" + subcls]["data-Skills bonus"] + ",";
									}
								}
								// Bonus Feat(s)
								if (mancerdata["l1-class"].data["class_subclass" + subcls]["data-Bonus Feat"]) {
									_.each(mancerdata["l1-class"].data["class_subclass" + subcls]["data-Bonus Feat"].split(","),(feat) => {
										FeatsToLoad.push("Feats:" + feat.trim());
									});
								}
								// Domain Spell
								if (mancerdata["l1-class"].data["class_subclass" + subcls]["data-Domain Spells Level 1"]) {
									_.each(mancerdata["l1-class"].data["class_subclass" + subcls]["data-Domain Spells Level 1"].split(","),(spell) => {
										let spl = {};
										spl["name"] = spell.trim();
										spl["level"] = 1;
										spl["domain"] = true;
										allSpells.push(spl);
										SpellsToLoad.push("Spells:" + spell.trim());
									});
								}
								// Traits
								if (mancerdata["l1-class"].data["class_subclass" + subcls]["data-Traits"]) {
									allTraits = allTraits.concat(mancerdata["l1-class"].data["class_subclass" + subcls]["data-Traits"]);
								}
								// Powers
								if (mancerdata["l1-class"].data["class_subclass" + subcls]["data-Powers"]) {
									allPowers = allPowers.concat(mancerdata["l1-class"].data["class_subclass" + subcls]["data-Powers"]);
									_.each(mancerdata["l1-class"].data["class_subclass" + subcls]["data-Powers"], (pawa) => {
										if (pawa["Spell-source"]) {
											SpellsToLoad.push("Spells:" + pawa["Spell-source"]);
										}
									});
								}
							}
						}
					}
				}

				// === 4.SPEED ===
				setCharmancerText({"mancer_category":"Calculation Speed","mancer_progress" :'<div style="width: 32%"></div>'});
				charUpd["speed_race"] = finalRaceSpeed;
				charUpd["class1_speed"] = finalClassSpeed;
				charUpd["speed_class"] = finalClassSpeed;

				// === 5.SAVES ===
				setCharmancerText({"mancer_category":"Calculation Saving Throws","mancer_progress" :'<div style="width: 40%"></div>'});
				let saves_array = [{"name": "fortitude","ability": "constitution"},{"name": "reflex","ability": "dexterity"},{"name": "will","ability": "wisdom"}];
				let saves_scores = {};
				// --- Preparing saves detailed array
				_.each(saves_array, (save) => {
					saves_scores[save.name] = {"total":0,"base":0,"race":0,"class":0,"subclass":0,"misc":0, "ability": save.ability};
				});
				// --- Abilities bonus
				if (mancerdata["l1-abilities"]) {
					_.each(saves_array, (save) => {
						saves_scores[save.name].base = ability_mods[save.ability];
					});
				}
				// --- Saves race
				if (bRaceData) {
					_.each(saves_array, (save) => {
						if (mancerdata["l1-race"].data.race["data-" + save.name.charAt(0).toUpperCase() + save.name.slice(1) + " Bonus"]) {
							saves_scores[save.name].race = (parseInt(mancerdata["l1-race"].data.race["data-" + save.name.charAt(0).toUpperCase() + save.name.slice(1) + " Bonus"]) || 0);
							charUpd[save.name + "_notes"] += "+" + saves_scores[save.name].race + " (" + charUpd["race"] + "). ";
						}
					});
				}
				// --- Saves class
				if (bClassData) {
					if (mancerdata["l1-class"].data.class["data-Fortitude"]) {
						saves_scores["fortitude"].class = parseInt(mancerdata["l1-class"].data.class["data-Fortitude"]) || 0;
					}
					if (mancerdata["l1-class"].data.class["data-Reflex"]) {
						saves_scores["reflex"].class = parseInt(mancerdata["l1-class"].data.class["data-Reflex"]) || 0;
					}
					if (mancerdata["l1-class"].data.class["data-Will"]) {
						saves_scores["will"].class = parseInt(mancerdata["l1-class"].data.class["data-Will"]) || 0;
					}
				}
				// --- Saves subclass
				let subclsvbonus = 0;
				if (mancerdata["l1-class"].values.class_subclass1) {
					if (mancerdata["l1-class"].data && mancerdata["l1-class"].data.class_subclass1 && mancerdata["l1-class"].data.class_subclass1["data-Saving Throws bonus"]) {
						subclsvbonus = parseInt(mancerdata["l1-class"].data.class_subclass1["data-Saving Throws bonus"].replace(/[^\d\-]/gi, "")) || 0;
						_.each(saves_array, (save) => {
							saves_scores[save.name].subclass = parseInt(saves_scores[save.name].subclass) + subclsvbonus;
						});
					}
				}
				if (mancerdata["l1-class"].values.class_subclass2) {
					if (mancerdata["l1-class"].data && mancerdata["l1-class"].data.class_subclass2 && mancerdata["l1-class"].data.class_subclass2["data-Saving Throws bonus"]) {
						subclsvbonus = parseInt(mancerdata["l1-class"].data.class_subclass2["data-Saving Throws bonus"].replace(/[^\d\-]/gi, "")) || 0;
						_.each(saves_array, (save) => {
							saves_scores[save.name].subclass = parseInt(saves_scores[save.name].subclass) + subclsvbonus;
						});
					}
				}
				// --- Saves misc
				// Final Saves calculation
				_.each(saves_array, (save) => {
					saves_scores[save.name].total = (parseInt(saves_scores[save.name].base) || 0) + (parseInt(saves_scores[save.name].race) || 0) + (parseInt(saves_scores[save.name].class) || 0) + (parseInt(saves_scores[save.name].subclass) || 0) + (parseInt(saves_scores[save.name].misc) || 0);
					charUpd["class1_" + save.name] = (parseInt(saves_scores[save.name].class) || 0) + (parseInt(saves_scores[save.name].subclass) || 0);
					charUpd[save.name + "_base"] = charUpd["class1_" + save.name];
					charUpd[save.name + "_ability_mod"] = saves_scores[save.name].base;
					charUpd[save.name + "_misc"] = (parseInt(saves_scores[save.name].race) || 0) + (parseInt(saves_scores[save.name].misc) || 0);
					charUpd[save.name] = saves_scores[save.name].total;
				});

				// === 6.SKILLS
				setCharmancerText({"mancer_category":"Calculation Skills","mancer_progress" :'<div style="width: 44%"></div>'});
				// Class skills
				if (allClassSkills.length) {
					_.each(allClassSkills.split(","), (cls) => {
						if (cls.trim().toLowerCase().replace(/[^a-z\s]/gi, "").replace(/\s/gi,"_").length) {
							charUpd[cls.trim().toLowerCase().replace(/[^a-z\s]/gi, "").replace(/\s/gi,"_") + "_classkill"] = 1;
						}
					});
				}
				// Bonus
				if (allSkillBonus.length) {
					_.each(allSkillBonus.split(","), (skl) => {
						if (skl.indexOf("+") != -1) {
							let skill = skl.split("+")[0].trim().toLowerCase().replace(/[^a-z\s]/gi,"").trim().replace(/\s/gi,"_");
							charUpd[skill + "_misc"] = (parseInt(charUpd[skill + "_misc"]) || 0) + (parseInt(skl.split("+")[1].replace(/[^\d\-]/gi, "")) || 0);
						}
					});
				}
				// Ranks
				if (mancerdata["l1-skills"] && mancerdata["l1-skills"].values) {
					_.each(Object.keys(mancerdata["l1-skills"].values), (skl) => {
						if (skl.slice(-6) == "_ranks") {
							charUpd[skl] = mancerdata["l1-skills"].values[skl];
						}
					});
				}
				// Notes
				if (! _.isEmpty(skillBonusNotes)) {
					_.each(Object.keys(skillBonusNotes),(key) => {
						if (skillBonusNotes[key]) {
							_.each(skillBonusNotes[key].split(","), (skl) => {
								if (skl.indexOf("+") != -1) {
									let skill = skl.split("+")[0].trim().toLowerCase().replace(/[^a-z\s]/gi, "").trim().replace(/\s/gi,"_");
									charUpd[skill + "_notes"] += "+" + skl.split("+")[1].replace(/[^\d\-]/gi, "") + " (" + key + "). ";
								}
							});
						}
					});
				}

				// === Add FEATS to load ===
				if (mancerdata["l1-feats"] && mancerdata["l1-feats"].values["feat_lvl1_1"]) {
					FeatsToLoad.push(mancerdata["l1-feats"].values["feat_lvl1_1"]);
				}

				// === Add SPELLS to load ===
				if (mancerdata["l1-spells"] && mancerdata["l1-spells"].values) {
					let i = 0;
					let j = 0;
					for (j = 0; j < 2; j++) {
						for (i = 1; i < 10; i++) {
							if (mancerdata["l1-spells"].values["spells_level_" + j + "_" + i]) {
								allSpells.push({"name":mancerdata["l1-spells"].values["spells_level_" + j + "_" + i],"level":j});
								SpellsToLoad.push(mancerdata["l1-spells"].values["spells_level_" + j + "_" + i]);
							}
						}
					}
				}

				// === 7.TRAITS ===
				setCharmancerText({"mancer_category":"Adding Traits","mancer_progress" :'<div style="width: 48%"></div>'});
				// console.log("*** MancerFinish traits: " + JSON.stringify(allTraits,null,"  "));
				_.each(allTraits, (trait) => {
					if (trait["Name"]) {
						let sec = "repeating_abilities_" + generateRowID() + "_";
						charUpd[sec + "name"] = trait["Name"];
						charUpd[sec + "options_flag"] = 0;
						if (trait["Type"]) {
							charUpd[sec + "type"] = trait["Type"];
						}
						if (trait["Per-day"]) {
							let perday = 0;
							if (trait["Per-day"].indexOf("+") == -1) {
								perday = parseInt(trait["Per-day"]) || 1;
							} else {
								perday = (parseInt(trait["Per-day"].split("+")[0].replace(/[^\d]/gi, "").trim()) || 1)
										+ (parseInt(ability_mods[trait["Per-day"].split("+")[1].replace("modifier", "").trim().toLowerCase()]) || 0);
							}
							if (perday > 0) {
								charUpd[sec + "perday_qty"] = perday;
								charUpd[sec + "perday_max"] = perday;
							}
						}
						if (trait["Description"]) {
							charUpd[sec + "description"] = trait["Description"];
						}
					}
				});

				// === 11.ATTACKS === (special Monk)
				if (bClassData && charUpd["class1_name"].toLowerCase() == "monk") {
					// Adding a Flurry of Blows
					let attackid = generateRowID();
					charUpd["repeating_attacks_" + attackid + "_atkname"] = getTranslationByKey("fob");
					charUpd["repeating_attacks_" + attackid + "_atktype"] = "fob";
					charUpd["repeating_attacks_" + attackid + "_atktype2"] = "strength";
					charUpd["repeating_attacks_" + attackid + "_dmgbase"] = "1d6";
					charUpd["repeating_attacks_" + attackid + "_dmgattr"] = "strength";
					charUpd["repeating_attacks_" + attackid + "_options_flag"] = "0";
				}

				setCharmancerText({"mancer_category":"Loading New Data","mancer_progress" :'<div style="width: 64%"></div>'});
				// Loading Compendium Pages
				let allCompendiumPages = [];
				allCompendiumPages = allCompendiumPages.concat(FeatsToLoad,SpellsToLoad);
				// console.log("*** DEBUG mancer_finish allCompendiumPages: " + allCompendiumPages);
				getCompendiumPage(allCompendiumPages,(compendiumdata) => {
					// console.log("*** DEBUG mancer_finish compendiumdata: " + JSON.stringify(compendiumdata,null," "));
					let cdatarr;
					if (typeof compendiumdata === "object") {
						cdatarr = Object.values(compendiumdata);
					} else if (Array.isArray(compendiumdata)) {
						cdatarr = compendiumdata;
					} else { // string
						cdatarr = [];
						cdatarr.push(compendiumdata);
					}
					// console.log("*** DEBUG mancer_finish cdatarr: " + JSON.stringify(cdatarr,null," "));
					// === 8.FEATS ===
					setCharmancerText({"mancer_category":"Adding Feats","mancer_progress" :'<div style="width: 72%"></div>'});
					// console.log("*** MancerFinish feats: " + FeatsToLoad);
					if (FeatsToLoad.length) {
						_.extend(charUpd,drop_add_feats(FeatsToLoad,cdatarr,true));
					}

					// === 9.SPELL LIKE ABILITIES ===
					setCharmancerText({"mancer_category":"Adding Powers","mancer_progress" :'<div style="width: 80%"></div>'});
					// console.log("*** MancerFinish powers: " + JSON.stringify(allPowers,null,"  "));
					if (allPowers.length) {
						_.extend(charUpd,drop_add_spellike(allPowers,cdatarr,charUpd,true));
					}
					// === 10.SPELLS ===
					setCharmancerText({"mancer_category":"Adding Spells","mancer_progress" :'<div style="width: 88%"></div>'});
					// console.log("*** MancerFinish spells: " + JSON.stringify(SpellsToLoad,null,"  ") + " " + JSON.stringify(allSpells,null,"  "));
					if (SpellsToLoad.length) {
						_.extend(charUpd,drop_add_spells(allSpells,cdatarr,charUpd,true));
					}

					// === 12.FINAL ===
					// console.log("*** DEBUG MancerFinish UPDATE: " + JSON.stringify(charUpd,null,"  "));
					setAttrs(charUpd,{silent: true},() => {
						setCharmancerText({"mancer_category":"Global update","mancer_progress" :'<div style="width: 100%"></div>'});
						recalculate("all",{},() => {
							update_ac_items();
							update_coins_weight();
							// console.log("*** DEBUG MancerFinish FINISH!");
							finishCharactermancer();
						});
					});
				});
			});
		};

// =============================================================================
// -----------------------------------------------------------------------------
// # Module : COMPENDIUM NPC DROPS
// -----------------------------------------------------------------------------
// =============================================================================

		const update_npc_drop = function(cdata, attrs,callback) {
			// console.log("*** DEBUG update_npc_drop cdata: " + JSON.stringify(cdata,null,"  "));
			var update = {...pfoglobals_currentversion_obj}; // update version
			// Initialize NPC & show building splash
			update["l1mancer_status"] = "completed";
			update["npc"] = 1;
			update["options_flag_npc"] = 0;
			setAttrs(update, {silent: true},() => {
				update = {};
				var tmpobj = {};
				var doUpdateSpells = false;
				var callbacks = [];
				// Base NPC information
				if (attrs["npcdrop_name"]) {
					update["character_name"] = attrs["npcdrop_name"];
				}
				if (attrs["npcdrop_uniq"]) {
					update["npc_fromcompendium"] = attrs["npcdrop_uniq"];
				} else {
					update["npc_fromcompendium"] = "Bestiary:" + attrs["npcdrop_name"];
				}
				update["armor_spell_failure"] = 0;
				// Icons
				if (cdata["icon-Climate"]) {
					update["npc_icon_climate"] = cdata["icon-Climate"].toLowerCase().trim();
				}
				if (cdata["icon-Terrain"]) {
					update["npc_icon_terrain"] = cdata["icon-Terrain"].toLowerCase().trim();
				}
				if (cdata["icon-CreatureType"]) {
					update["npc_icon_type"] = cdata["icon-CreatureType"].toLowerCase().trim();
				}
				// Expansion for header color
				if (cdata["Expansion"] || cdata["expansion"]) { // "Expansion\":\"8\" => Bestiary
					update["npc_expansion"] = cdata["Expansion"] || cdata["expansion"];
				}
				// === Compendium data handling
				if (cdata["data-Size"]) {
					if (["fine","diminutive","tiny","small","medium","large","huge","gargantuan","colossal"].includes(cdata["data-Size"].toLowerCase())) {
						update["size"] = cdata["data-Size"].toLowerCase();
						update["size_display"] = getTranslationByKey(cdata["data-Size"].toLowerCase());
					} else {
						update["size_display"] = cdata["data-Size"];
					}
				}
				// Spells raw data
				if (cdata["data-Spell Caster Level"]) {
					update["caster1_level"] = parseInt(cdata["data-Spell Caster Level"]) || 0;
				}
				if (cdata["data-Spell Caster Concentration"]) {
					update["caster1_concentration"] = parseInt(cdata["data-Spell Caster Concentration"]) || 0;
				}
				var objspells;
				if (cdata["data-Spells"]) {
					try{
						objspells = JSON.parse(cdata["data-Spells"]);
					}
					catch(error) {
						objspells = [];
					}
					update["spells_flag"] = 1;
				} else if (cdata["data-Spells Misc"]) {
					objspells = [];
					update["npc_spells_notes"] = cdata["data-Spells Misc"];
					update["spells_flag"] = 1;
				} else {
					objspells = [];
					update["spells_flag"] = 0;
				}
				// Spells infos (except spells) & per day
				for (var i = 1; i < 10; i++) {
					if (cdata["data-Spells per day-Level " + i]) {
						update["caster1_spells_perday_level_" + i] = parseInt(cdata["data-Spells per day-Level " + i]) || 0;
						update["caster1_spells_total_level_" + i] = parseInt(cdata["data-Spells per day-Level " + i]) || 0;
					}
				}
				if (objspells.length) {
					// Counting the spells by level
					var spellsbylevel = objspells.reduce(function(sums,entry){
						sums[entry.level] = (sums[entry.level] || 0) + 1;
						return sums;
					},{});
					for (var i = 1; i < 10; i++) {
						if ( (spellsbylevel["" + i]) && (! update["caster1_spells_perday_level_" + i]) ) {
							update["caster1_spells_perday_level_" + i] = spellsbylevel["" + i];
							update["caster1_spells_total_level_" + i] = spellsbylevel["" + i];
						}
					}
				}
				if (cdata["data-Bloodlines Domains Schools"]) {
					update["caster1_spells_notes"] = cdata["data-Bloodlines Domains Schools"];
				}
				// Spell-like raw data
				if (cdata["data-Spell-Like Abilities Caster Level"]) {
					update["caster2_level"] = parseInt(cdata["data-Spell-Like Abilities Caster Level"]) || 0;
				}
				if (cdata["data-Spell-Like Abilities Concentration"]) {
					update["caster2_concentration"] = parseInt(cdata["data-Spell-Like Abilities Concentration"]) || 0;
				}
				var objlikes;
				if (cdata["data-Spell-like Abilities"]) {
					try{
						objlikes = JSON.parse(cdata["data-Spell-like Abilities"]);
					}
					catch(error){
						objlikes = [];
					}
					update["spellabilities_flag"] = 1;
				} else if (cdata["data-Spell-Like Abilities Misc"]) {
					objlikes = [];
					update["npc_spellabilities_notes"] = cdata["data-Spell-Like Abilities Misc"];
					update["spellabilities_flag"] = 1;
				} else {
					objlikes = [];
					update["spellabilities_flag"] = 0;
				}
				if (cdata["data-CR"]) {
					update["npc_cr"] = cdata["data-CR"];
				}
				if (cdata["data-MR"]) {
					update["npc_mr"] = cdata["data-MR"];
				}
				if (cdata["data-XP"]) {
					update["xp"] = cdata["data-XP"];
				}
				if (cdata["data-Race Class Level"]) {
					update["class"] = cdata["data-Race Class Level"];
				}
				if (cdata["data-Alignment"]) {
					update["npc_alignment"] = cdata["data-Alignment"];
				}
				if (cdata["data-Type"]) {
					update["npc_type"] = cdata["data-Type"];
				}
				if (cdata["data-Initiative"]) {
					update["initiative"] = parseInt(cdata["data-Initiative"]) || 0;
				}
				if (cdata["data-Initiative Notes"]) {
					update["initiative_notes"] = "(" + cdata["data-Initiative Notes"] + ")";
				}
				if (cdata["data-Senses"]) {
					update["senses"] = cdata["data-Senses"];
				}
				if (cdata["data-Aura"]) {
					update["aura"] = cdata["data-Aura"];
				}
				if (cdata["data-AC"]) {
					update["ac"] = (parseInt(cdata["data-AC"]) || 0);
				}
				if (cdata["data-AC Touch"]) {
					update["ac_touch"] = (parseInt(cdata["data-AC Touch"]) || 0);
				}
				if (cdata["data-AC Flat-Footed"]) {
					update["ac_flatfooted"] = (parseInt(cdata["data-AC Flat-Footed"]) || 0);
				}
				if (cdata["data-AC Notes"]) {
					update["ac_notes"] = cdata["data-AC Notes"];
				}
				if (cdata["data-HP"]) {
					update["hp"] = parseInt(cdata["data-HP"]) || 0;
					update["hp_max"] = parseInt(cdata["data-HP"]) || 0;
				}
				if (cdata["data-HP Notes"]) {
					update["hp_notes"] = cdata["data-HP Notes"];
				}
				if (cdata["data-HP Roll"]) {
					update["hd_roll"] = cdata["data-HP Roll"];
				}
				if (cdata["data-HD"]) {
					update["hd"] = cdata["data-HD"];
				}
				if (cdata["data-Fort"]) {
					update["fortitude"] = parseInt(cdata["data-Fort"]) || 0;
				}
				if (cdata["data-Ref"]) {
					update["reflex"] = parseInt(cdata["data-Ref"]) || 0;
				}
				if (cdata["data-Will"]) {
					update["will"] = parseInt(cdata["data-Will"]) || 0;
				}
				if (cdata["data-Save Modifiers"]) {
					update["saves_modifiers"] = cdata["data-Save Modifiers"];
				}
				if (cdata["data-SR"]) {
					update["sr"] = parseInt(cdata["data-SR"]) || 0;
				}
				if (cdata["data-Defensive Abilities"]) {
					update["defensive_abilities"] = cdata["data-Defensive Abilities"];
				}
				if (cdata["data-DR"]) {
					update["npc_dr"] = cdata["data-DR"];
				}
				if (cdata["data-Immunities"]) {
					update["immune"] = cdata["data-Immunities"];
				}
				if (cdata["data-Resistances"]) {
					update["resist"] = cdata["data-Resistances"];
				}
				if (cdata["data-Weaknesses"]) {
					update["weaknesses"] = cdata["data-Weaknesses"];
				}
				if (cdata["data-Speed"]) {
					update["npc_speed"] = cdata["data-Speed"];
				}
				if (cdata["data-Space"]) {
					update["space"] = cdata["data-Space"];
				}
				if (cdata["data-Reach"]) {
					update["reach"] = cdata["data-Reach"];
				}
				if (cdata["data-Tactics"]) {
					update["tactics"] = cdata["data-Tactics"];
				}
				// Basic Stats
				if (cdata["data-STR"]) {
					update["strength"] = parseInt(cdata["data-STR"]) || "-";
				} else {
					update["strength"] = "-";
				}
				tmpobj = calc_ability_mod("strength",update);
				_.extend(update, tmpobj);
				if (cdata["data-DEX"]) {
					update["dexterity"] = parseInt(cdata["data-DEX"]) || "-";
				} else {
					update["dexterity"] = "-";
				}
				tmpobj = calc_ability_mod("dexterity",update);
				_.extend(update, tmpobj);
				if (cdata["data-CON"]) {
					update["constitution"] = parseInt(cdata["data-CON"]) || "-";
				} else {
					update["constitution"] = "-";
				}
				tmpobj = calc_ability_mod("constitution",update);
				_.extend(update, tmpobj);
				if (cdata["data-INT"]) {
					update["intelligence"] = parseInt(cdata["data-INT"]) || "-";
				} else {
					update["intelligence"] = "-";
				}
				tmpobj = calc_ability_mod("intelligence",update);
				_.extend(update, tmpobj);
				if (cdata["data-WIS"]) {
					update["wisdom"] = parseInt(cdata["data-WIS"]) || "-";
				} else {
					update["wisdom"] = "-";
				}
				tmpobj = calc_ability_mod("wisdom",update);
				_.extend(update, tmpobj);
				if (cdata["data-CHA"]) {
					update["charisma"] = parseInt(cdata["data-CHA"]) || "-";
				} else {
					update["charisma"] = "-";
				}
				tmpobj = calc_ability_mod("charisma",update);
				_.extend(update, tmpobj);
				if (cdata["data-Base Atk"]) {
					update["bab"] = parseInt(cdata["data-Base Atk"]) || 0;
				} else {
					update["bab"] = 0;
				}
				if (cdata["data-CMB"]) {
					update["cmb_mod"] = parseInt(cdata["data-CMB"]) || 0;
				} else {
					update["cmb_mod"] = 0;
				}
				if (cdata["data-CMB Notes"]) {
					update["cmb_notes"] = cdata["data-CMB Notes"];
				}
				if (cdata["data-CMD"]) {
					update["cmd_mod"] = parseInt(cdata["data-CMD"]) || 0;
				} else {
					update["cmd_mod"] = 0;
				}
				if (cdata["data-CMD Notes"]) {
					update["cmd_notes"] = cdata["data-CMD Notes"];
				}
				if (cdata["data-Skills Racial Modifiers"]) {
					update["skills_racial_modifiers"] = cdata["data-Skills Racial Modifiers"];
				}
				// SKILLS
				if (cdata["data-Acrobatics"]) {
					update["acrobatics"] = parseInt(cdata["data-Acrobatics"]) || 0;
				}
				if (cdata["data-Acrobatics Notes"]) {
					update["acrobatics_notes"] = cdata["data-Acrobatics Notes"];
				}
				_.extend(update,calc_npc_skill_display("acrobatics",(cdata["data-Acrobatics"] || ""),(cdata["data-Acrobatics Notes"] || "")));
				if (cdata["data-Appraise"]) {
					update["appraise"] = parseInt(cdata["data-Appraise"]) || 0;
				}
				if (cdata["data-Appraise Notes"]) {
					update["appraise_notes"] = cdata["data-Appraise Notes"];
				}
				_.extend(update,calc_npc_skill_display("appraise",(cdata["data-Appraise"] || ""),(cdata["data-Appraise Notes"] || "")));
				if (cdata["data-Bluff"]) {
					update["bluff"] = parseInt(cdata["data-Bluff"]) || 0;
				}
				if (cdata["data-Bluff Notes"]) {
					update["bluff_notes"] = cdata["data-Bluff Notes"];
				}
				_.extend(update,calc_npc_skill_display("bluff",(cdata["data-Bluff"] || ""),(cdata["data-Bluff Notes"] || "")));
				if (cdata["data-Climb"]) {
					update["climb"] = parseInt(cdata["data-Climb"]) || 0;
				}
				if (cdata["data-Climb Notes"]) {
					update["climb_notes"] = cdata["data-Climb Notes"];
				}
				_.extend(update,calc_npc_skill_display("climb",(cdata["data-Climb"] || ""),(cdata["data-Climb Notes"] || "")));
				if (cdata["data-Craft"]) {
					update["craft"] = parseInt(cdata["data-Craft"]) || 0;
				}
				if (cdata["data-Craft Notes"]) {
					update["craft_notes"] = cdata["data-Craft Notes"];
				}
				_.extend(update,calc_npc_skill_display("craft",(cdata["data-Craft"] || ""),(cdata["data-Craft Notes"] || "")));
				if (cdata["data-Diplomacy"]) {
					update["diplomacy"] = parseInt(cdata["data-Diplomacy"]) || 0;
				}
				if (cdata["data-Diplomacy Notes"]) {
					update["diplomacy_notes"] = cdata["data-Diplomacy Notes"];
				}
				_.extend(update,calc_npc_skill_display("diplomacy",(cdata["data-Diplomacy"] || ""),(cdata["data-Diplomacy Notes"] || "")));
				if (cdata["data-Disable Device"]) {
					update["disable_device"] = parseInt(cdata["data-Disable Device"]) || 0;
				}
				if (cdata["data-Disable Device Notes"]) {
					update["disable_device_notes"] = cdata["data-Disable Device Notes"];
				}
				_.extend(update,calc_npc_skill_display("disable_device",(cdata["data-Disable Device"] || ""),(cdata["data-Disable Device Notes"] || "")));
				if (cdata["data-Disguise"]) {
					update["disguise"] = parseInt(cdata["data-Disguise"]) || 0;
				}
				if (cdata["data-Disguise Notes"]) {
					update["disguise_notes"] = cdata["data-Disguise Notes"];
				}
				_.extend(update,calc_npc_skill_display("disguise",(cdata["data-Disguise"] || ""),(cdata["data-Disguise Notes"] || "")));
				if (cdata["data-Escape Artist"]) {
					update["escape_artist"] = parseInt(cdata["data-Escape Artist"]) || 0;
				}
				if (cdata["data-Escape Artist Notes"]) {
					update["escape_artist_notes"] = cdata["data-Escape Artist Notes"];
				}
				_.extend(update,calc_npc_skill_display("escape_artist",(cdata["data-Escape Artist"] || ""),(cdata["data-Escape Artist Notes"] || "")));
				if (cdata["data-Fly"]) {
					update["fly"] = parseInt(cdata["data-Fly"]) || 0;
				}
				if (cdata["data-Fly Notes"]) {
					update["fly_notes"] = cdata["data-Fly Notes"];
				}
				_.extend(update,calc_npc_skill_display("fly",(cdata["data-Fly"] || ""),(cdata["data-Fly Notes"] || "")));
				if (cdata["data-Handle Animal"]) {
					update["handle_animal"] = parseInt(cdata["data-Handle Animal"]) || 0;
				}
				if (cdata["data-Handle Animal Notes"]) {
					update["handle_animal_notes"] = cdata["data-Handle Animal Notes"];
				}
				_.extend(update,calc_npc_skill_display("handle_animal",(cdata["data-Handle Animal"] || ""),(cdata["data-Handle Animal Notes"] || "")));
				if (cdata["data-Heal"]) {
					update["heal"] = parseInt(cdata["data-Heal"]) || 0;
				}
				if (cdata["data-Heal Notes"]) {
					update["heal_notes"] = cdata["data-Heal Notes"];
				}
				_.extend(update,calc_npc_skill_display("heal",(cdata["data-Heal"] || ""),(cdata["data-Heal Notes"] || "")));
				if (cdata["data-Intimidate"]) {
					update["intimidate"] = parseInt(cdata["data-Intimidate"]) || 0;
				}
				if (cdata["data-Intimidate Notes"]) {
					update["intimidate_notes"] = cdata["data-Intimidate Notes"];
				}
				_.extend(update,calc_npc_skill_display("intimidate",(cdata["data-Intimidate"] || ""),(cdata["data-Intimidate Notes"] || "")));
				if (cdata["data-Knowledge Arcana"]) {
					update["knowledge_arcana"] = parseInt(cdata["data-Knowledge Arcana"]) || 0;
				}
				if (cdata["data-Knowledge Arcana Notes"]) {
					update["knowledge_arcana_notes"] = cdata["data-Knowledge Arcana Notes"];
				}
				_.extend(update,calc_npc_skill_display("knowledge_arcana",(cdata["data-Knowledge Arcana"] || ""),(cdata["data-Knowledge Arcana Notes"] || "")));
				if (cdata["data-Knowledge Dungeoneering"]) {
					update["knowledge_dungeoneering"] = parseInt(cdata["data-Knowledge Dungeoneering"]) || 0;
				}
				if (cdata["data-Knowledge Dungeoneering Notes"]) {
					update["knowledge_dungeoneering_notes"] = cdata["data-Knowledge Dungeoneering Notes"];
				}
				_.extend(update,calc_npc_skill_display("knowledge_dungeoneering",(cdata["data-Knowledge Dungeoneering"] || ""),(cdata["data-Knowledge Dungeoneering Notes"] || "")));
				if (cdata["data-Knowledge Engineering"]) {
					update["knowledge_engineering"] = parseInt(cdata["data-Knowledge Engineering"]) || 0;
				}
				if (cdata["data-Knowledge Engineering Notes"]) {
					update["knowledge_engineering_notes"] = cdata["data-Knowledge Engineering Notes"];
				}
				_.extend(update,calc_npc_skill_display("knowledge_engineering",(cdata["data-Knowledge Engineering"] || ""),(cdata["data-Knowledge Engineering Notes"] || "")));
				if (cdata["data-Knowledge Geography"]) {
					update["knowledge_geography"] = parseInt(cdata["data-Knowledge Geography"]) || 0;
				}
				if (cdata["data-Knowledge Geography Notes"]) {
					update["knowledge_geography_notes"] = cdata["data-Knowledge Geography Notes"];
				}
				_.extend(update,calc_npc_skill_display("knowledge_geography",(cdata["data-Knowledge Geography"] || ""),(cdata["data-Knowledge Geography Notes"] || "")));
				if (cdata["data-Knowledge History"]) {
					update["knowledge_history"] = parseInt(cdata["data-Knowledge History"]) || 0;
				}
				if (cdata["data-Knowledge History Notes"]) {
					update["knowledge_history_notes"] = cdata["data-Knowledge History Notes"];
				}
				_.extend(update,calc_npc_skill_display("knowledge_history",(cdata["data-Knowledge History"] || ""),(cdata["data-Knowledge History Notes"] || "")));
				if (cdata["data-Knowledge Local"]) {
					update["knowledge_local"] = parseInt(cdata["data-Knowledge Local"]) || 0;
				}
				if (cdata["data-Knowledge Local Notes"]) {
					update["knowledge_local_notes"] = cdata["data-Knowledge Local Notes"];
				}
				_.extend(update,calc_npc_skill_display("knowledge_local",(cdata["data-Knowledge Local"] || ""),(cdata["data-Knowledge Local Notes"] || "")));
				if (cdata["data-Knowledge Nature"]) {
					update["knowledge_nature"] = parseInt(cdata["data-Knowledge Nature"]) || 0;
				}
				if (cdata["data-Knowledge Nature Notes"]) {
					update["knowledge_nature_notes"] = cdata["data-Knowledge Nature Notes"];
				}
				_.extend(update,calc_npc_skill_display("knowledge_nature",(cdata["data-Knowledge Nature"] || ""),(cdata["data-Knowledge Nature Notes"] || "")));
				if (cdata["data-Knowledge Nobility"]) {
					update["knowledge_nobility"] = parseInt(cdata["data-Knowledge Nobility"]) || 0;
				}
				if (cdata["data-Knowledge Nobility Notes"]) {
					update["knowledge_nobility_notes"] = cdata["data-Knowledge Nobility Notes"];
				}
				_.extend(update,calc_npc_skill_display("knowledge_nobility",(cdata["data-Knowledge Nobility"] || ""),(cdata["data-Knowledge Nobility Notes"] || "")));
				if (cdata["data-Knowledge Planes"]) {
					update["knowledge_planes"] = parseInt(cdata["data-Knowledge Planes"]) || 0;
				}
				if (cdata["data-Knowledge Planes Notes"]) {
					update["knowledge_planes_notes"] = cdata["data-Knowledge Planes Notes"];
				}
				_.extend(update,calc_npc_skill_display("knowledge_planes",(cdata["data-Knowledge Planes"] || ""),(cdata["data-Knowledge Planes Notes"] || "")));
				if (cdata["data-Knowledge Religion"]) {
					update["knowledge_religion"] = parseInt(cdata["data-Knowledge Religion"]) || 0;
				}
				if (cdata["data-Knowledge Religion Notes"]) {
					update["knowledge_religion_notes"] = cdata["data-Knowledge Religion Notes"];
				}
				_.extend(update,calc_npc_skill_display("knowledge_religion",(cdata["data-Knowledge Religion"] || ""),(cdata["data-Knowledge Religion Notes"] || "")));
				if (cdata["data-Linguistics"]) {
					update["linguistics"] = parseInt(cdata["data-Linguistics"]) || 0;
				}
				if (cdata["data-Linguistics Notes"]) {
					update["linguistics_notes"] = cdata["data-Linguistics Notes"];
				}
				_.extend(update,calc_npc_skill_display("linguistics",(cdata["data-Linguistics"] || ""),(cdata["data-Linguistics Notes"] || "")));
				if (cdata["data-Perception"]) {
					update["perception"] = parseInt(cdata["data-Perception"]) || 0;
				}
				if (cdata["data-Perception Notes"]) {
					update["perception_notes"] = cdata["data-Perception Notes"];
				}
				_.extend(update,calc_npc_skill_display("perception",(cdata["data-Perception"] || ""),(cdata["data-Perception Notes"] || "")));
				if (cdata["data-Perform"]) {
					update["perform"] = parseInt(cdata["data-Perform"]) || 0;
				}
				if (cdata["data-Perform Notes"]) {
					update["perform_notes"] = cdata["data-Perform Notes"];
				}
				_.extend(update,calc_npc_skill_display("perform",(cdata["data-Perform"] || ""),(cdata["data-Perform Notes"] || "")));
				if (cdata["data-Profession"]) {
					update["profession"] = parseInt(cdata["data-Profession"]) || 0;
				}
				if (cdata["data-Profession Notes"]) {
					update["profession_notes"] = cdata["data-Profession Notes"];
				}
				_.extend(update,calc_npc_skill_display("profession",(cdata["data-Profession"] || ""),(cdata["data-Profession Notes"] || "")));
				if (cdata["data-Ride"]) {
					update["ride"] = parseInt(cdata["data-Ride"]) || 0;
				}
				if (cdata["data-Ride Notes"]) {
					update["ride_notes"] = cdata["data-Ride Notes"];
				}
				_.extend(update,calc_npc_skill_display("ride",(cdata["data-Ride"] || ""),(cdata["data-Ride Notes"] || "")));
				if (cdata["data-Sense Motive"]) {
					update["sense_motive"] = parseInt(cdata["data-Sense Motive"]) || 0;
				}
				if (cdata["data-Sense Motive Notes"]) {
					update["sense_motive_notes"] = cdata["data-Sense Motive Notes"];
				}
				_.extend(update,calc_npc_skill_display("sense_motive",(cdata["data-Sense Motive"] || ""),(cdata["data-Sense Motive Notes"] || "")));
				if (cdata["data-Sleight Of Hand"]) {
					update["sleight_of_hand"] = parseInt(cdata["data-Sleight Of Hand"]) || 0;
				}
				if (cdata["data-Sleight Of Hand Notes"]) {
					update["sleight_of_hand_notes"] = cdata["data-Sleight Of Hand Notes"];
				}
				_.extend(update,calc_npc_skill_display("sleight_of_hand",(cdata["data-Sleight Of Hand"] || ""),(cdata["data-Sleight Of Hand Notes"] || "")));
				if (cdata["data-Spellcraft"]) {
					update["spellcraft"] = parseInt(cdata["data-Spellcraft"]) || 0;
				}
				if (cdata["data-Spellcraft Notes"]) {
					update["spellcraft_notes"] = cdata["data-Spellcraft Notes"];
				}
				_.extend(update,calc_npc_skill_display("spellcraft",(cdata["data-Spellcraft"] || ""),(cdata["data-Spellcraft Notes"] || "")));
				if (cdata["data-Stealth"]) {
					update["stealth"] = parseInt(cdata["data-Stealth"]) || 0;
				}
				if (cdata["data-Stealth Notes"]) {
					update["stealth_notes"] = cdata["data-Stealth Notes"];
				}
				_.extend(update,calc_npc_skill_display("stealth",(cdata["data-Stealth"] || ""),(cdata["data-Stealth Notes"] || "")));
				if (cdata["data-Survival"]) {
					update["survival"] = parseInt(cdata["data-Survival"]) || 0;
				}
				if (cdata["data-Survival Notes"]) {
					update["survival_notes"] = cdata["data-Survival Notes"];
				}
				_.extend(update,calc_npc_skill_display("survival",(cdata["data-Survival"] || ""),(cdata["data-Survival Notes"] || "")));
				if (cdata["data-Swim"]) {
					update["swim"] = parseInt(cdata["data-Swim"]) || 0;
				}
				if (cdata["data-Swim Notes"]) {
					update["swim_notes"] = cdata["data-Swim Notes"];
				}
				_.extend(update,calc_npc_skill_display("swim",(cdata["data-Swim"] || ""),(cdata["data-Swim Notes"] || "")));
				if (cdata["data-Use Magic Device"]) {
					update["use_magic_device"] = parseInt(cdata["data-Use Magic Device"]) || 0;
				}
				if (cdata["data-Use Magic Device Notes"]) {
					update["use_magic_device_notes"] = cdata["data-Use Magic Device Notes"];
				}
				_.extend(update,calc_npc_skill_display("use_magic_device",(cdata["data-Use Magic Device"] || ""),(cdata["data-Use Magic Device Notes"] || "")));
				if (cdata["data-Skills Misc"]) {
					update["skills_notes"] = cdata["data-Skills Misc"];
				}
				// END SKILLS
				if (cdata["data-Languages"]) {
					update["languages"] = cdata["data-Languages"];
				}
				if (cdata["data-SQ"]) {
					update["sq"] = cdata["data-SQ"];
				}
				if (cdata["data-Combat Gear"]) {
					update["combat_gear"] = cdata["data-Combat Gear"];
				}
				if (cdata["data-Environment"]) {
					update["environment"] = cdata["data-Environment"];
				}
				if (cdata["data-Organization"]) {
					update["organization"] = cdata["data-Organization"];
				}
				if (cdata["data-Treasure"]) {
					update["treasure"] = cdata["data-Treasure"];
				}
				if (cdata["data-Description"]) {
					update["background"] = cdata["data-Description"];
				}
				// ATTACKS AND POWERS
				if (cdata["data-Attacks"]) {
					var atkz;
					try{
						atkz = JSON.parse(cdata["data-Attacks"]);
					}
					catch(error){
						atkz = [];
					}
					if (atkz.length) {
						_.extend(update, npcdrop_add_attacks(atkz,update));
					}
				} else if (cdata["Melee"] || cdata["Ranged"]) {
					// Parsing PRD Monsters attacks
					if (cdata["Melee"]) {
						update["meleeattacks_flag"] = 1;
						_.extend(update, npc_attack_parser(cdata["Melee"],"melee",update));
					} else {
						update["meleeattacks_flag"] = 0;
					}
					if (cdata["Ranged"]) {
						update["rangedattacks_flag"] = 1;
						_.extend(update, npc_attack_parser(cdata["Ranged"],"ranged",update));
					} else {
						update["rangedattacks_flag"] = 0;
					}
				}
				if (cdata["data-Special Atk"]) {
					var specz;
					try{
						specz = JSON.parse(cdata["data-Special Atk"]);
					}
					catch(error) {
						specz = [];
					}
					if (specz.length) {
						_.extend(update, npcdrop_add_special_attacks(specz));
					}
				} else if (cdata["Special Attacks"]) {
					update["specialattacks_flag"] = 1;
					update["specialattacks_notes"] = cdata["Special Attacks"];
				} else {
					update["specialattacks_flag"] = 0;
				}
				if (cdata["data-Special abilities"]) {
					var abz;
					try{
						abz = JSON.parse(cdata["data-Special Abilities"]);
					}
					catch(error) {
						abz = [];
					}
					if (abz.length) {
						_.extend(update, npcdrop_add_specabs(abz));
					}
				}
				// Do 2 setAttrs: one "quick", one "long" (after getCompendiumPages), to avoid setTokenAttrs timeout
				setAttrs(update,{silent: true},() => {
					if (callback) {
						callback();
					}
					update = {};
					var pages = [];
					if (objspells.length) {
						doUpdateSpells = true;
						_.each(objspells, (obj) => {
							if (obj.name) {
								pages.push("Spells:" + toTitleCase(obj.name));
							}
						});
					}
					if (objlikes.length) {
						doUpdateSpells = true;
						_.each(objlikes, (obj) => {
							if (obj["Name"] && obj["Spell"]) {
								pages.push("Spells:" + toTitleCase(obj["Spell"]));
							}
						});
					}
					if (cdata["data-Feats"]) {
						var parsed;
						var objfeats;
						try {
							parsed = JSON.parse(cdata["data-Feats"]);
						}
						catch(error) {
							parsed = cdata["data-Feats"].split(",");
						}
						if (Array.isArray(parsed)) {
							objfeats = parsed;
						} else {
							objfeats = [];
						}
						// console.log("*** DEBUG update_npc_drop feats parsing: " + objfeats);
						_.each(objfeats, (obj) => {
							var featname = "";
							if (obj.indexOf("(") === -1) {
								featname = "Feats:" + obj.trim();
							} else {
								featname = "Feats:" + obj.split("(")[0].trim();
							}
							pages.push(featname);
						});
					} else {
						var objfeats = [];
					}
					// console.log("*** DEBUG update_npc_drop pages: " + pages);
					getCompendiumPage(pages,(compendiumdata) => {
						// console.log("*** DEBUG update_npc_drop compendiumdata: " + JSON.stringify(compendiumdata,null," "));
						let cdatarr;
						if (typeof compendiumdata === "object") {
							cdatarr = Object.values(compendiumdata);
						} else if (Array.isArray(compendiumdata)) {
							cdatarr = compendiumdata;
						} else { // String
							cdatarr = [];
							cdatarr.push(compendiumdata);
						}
						// console.log("*** DEBUG update_npc_drop cdatarr: " + JSON.stringify(cdatarr,null," "));
						if (objspells.length) {
							tmpobj = drop_add_spells(objspells,cdatarr,update,false);
							_.extend(update, tmpobj);
						}
						if (objlikes.length) {
							tmpobj = drop_add_spellike(objlikes,cdatarr,update,false);
							_.extend(update, tmpobj);
						}
						if (objfeats.length) {
							tmpobj = drop_add_feats(objfeats,cdatarr,false);
							_.extend(update, tmpobj);
						}
						setAttrs(update,{silent: true},() => {
							// Hide building splash
							setAttrs({"build_flag_npc": 0},{silent: true});
						});
					});
				});
			});
		};
		const npcdrop_add_attacks = function(objs,values) {
			// console.log("*** DEBUG npcdrop_add_attacks objs: " + JSON.stringify(objs,null,"  "));
			let update = {};
			let meleecount = 0;
			let rangedcount = 0;
			_.each(objs, (obj) => {
				if (obj["Name"]) {
					let newrowid = generateRowID();
					let repsec = "";
					let type = "";
					if (obj["Range"]) {
						rangedcount++;
						repsec = "repeating_npcatk-ranged_";
						type = "ranged";
						update[`${repsec}${newrowid}_atkrange`] = obj["Range"];
					} else {
						meleecount++;
						repsec = "repeating_npcatk-melee_";
						type = "melee";
					}
					update[`${repsec}${newrowid}_atkname`] = obj["Name"];
					update[`${repsec}${newrowid}_options_flag`] = 0;
					if (obj["Attack Bonuses"]) { // atkmod -> atkmod9
						let atkmodz = obj["Attack Bonuses"].replace(/[^\d\/\-]/gi, '');
						if (atkmodz.indexOf("/") == -1) { // one attack
							update[`${repsec}${newrowid}_atkmod`] = atkmodz;
						} else { // multiple attacks, up to 9
							let atks = atkmodz.split("/");
							update[`${repsec}${newrowid}_multipleatk_flag`] = 1;
							let i = 1;
							_.each(atks, (atk) => {
								update[`${repsec}${newrowid}_atkmod` + ((i > 1) ? i : "")] = atk;
								i++;
							});
						}
					} else {
						update[`${repsec}${newrowid}_atkmod`] = "0";
					}
					if (obj["Critical Range"]) {
						update[`${repsec}${newrowid}_atkcritrange`] = parseInt(obj["Critical Range"]) || 20;
					} else {
						update[`${repsec}${newrowid}_atkcritrange`] = 20;
					}
					if (obj["Damage 1"]) {
						update[`${repsec}${newrowid}_dmgflag`] = 1;
						update[`${repsec}${newrowid}_dmgbase`] = obj["Damage 1"];
					}
					if (obj["Damage 1 Notes or Type"]) {
						update[`${repsec}${newrowid}_dmgtype`] = obj["Damage 1 Notes or Type"];
					} else {
						update[`${repsec}${newrowid}_dmgtype`] = "";
					}
					if (obj["Damage 1 Critical Multiplier"]) {
						update[`${repsec}${newrowid}_dmgcritmulti`] = parseInt(obj["Damage 1 Critical Multiplier"].toLowerCase().replace(/[^\d]/gi,"")) || 2;
					}
					if (obj["Damage 2"]) {
						update[`${repsec}${newrowid}_dmg2flag`] = 1;
						update[`${repsec}${newrowid}_dmg2base`] = obj["Damage 2"];
					}
					if (obj["Damage 2 Notes or Type"]) {
						update[`${repsec}${newrowid}_dmg2type`] = obj["Damage 2 Notes or Type"];
					} else {
						update[`${repsec}${newrowid}_dmg2type`] = "";
					}
					if (obj["Damage 2 Critical Multiplier"]) {
						update[`${repsec}${newrowid}_dmg2critmulti`] = parseInt(obj["Damage 2 Critical Multiplier"].toLowerCase().replace(/[^\d]/gi,"")) || 2;
					}
					if (obj["Description"]) {
						update[`${repsec}${newrowid}_descflag`] = 1;
						update[`${repsec}${newrowid}_atkdesc`] = obj["Description"];
					}
					let tmpvalues = {};
					_.extend(tmpvalues,values,update);
					tmpvalues["npc"] = "1";
					_.extend(update,calc_npc_attack(type,newrowid,tmpvalues));
				}
			});
			if (! _.isEmpty(update)) {
				update["meleeattacks_flag"] = (meleecount > 0) ? 1 : 0;
				update["rangedattacks_flag"] = (rangedcount > 0) ? 1 : 0;
			} else {
				update["meleeattacks_flag"] = 0;
				update["rangedattacks_flag"] = 0;
			}
			// console.log("*** DEBUG npcdrop_add_attacks update: " + JSON.stringify(update,null,"  "));
			return update;
		};
		const npc_attack_parser = function(source,type,values) {
			let repsec = "repeating_npcatk-melee_";
			if (type == "ranged") {
				repsec = "repeating_npcatk-ranged_";
			}
			// console.log("*** DEBUG npc_attack_parser: " + source + ", " + repsec);
			let update = {};
			let strz = source.replace(/\)\s+(or|Or|OR|and|And|AND)\s+/g,"), ").split(",").map(x => x.trim());
			let newrowid = "";
			_.each(strz, (str) => {
				newrowid = generateRowID();
				let atkstr = ((str.split("(")[0]) || "").trim();
				let dmgstr = ((str.split("(")[1]) || "").trim().replace(/\)$/, "").trim();

				// Safe pre settings
				update[`${repsec}${newrowid}_atkname`] = "Unknown";
				update[`${repsec}${newrowid}_atkmod`] = "0";
				update[`${repsec}${newrowid}_dmgtype`] = " ";
				update[`${repsec}${newrowid}_atkcritrange`] = 20;
				update[`${repsec}${newrowid}_dmgcritmulti`] = 2;
				update[`${repsec}${newrowid}_dmgbase`] = "";
				update[`${repsec}${newrowid}_atkdesc`] = "";
				// Attack names and bonuses
				let i = 0;
				_.each(atkstr.match(/(^|\+|\-)[^\+\-]+(?=(\-|\+)|$)/g), (atk) => {
					if (atk) {
						update[repsec + newrowid + ((i > 0) ? "_atkmod" : "_atkname") + ((i > 1) ? i : "")] = ((i > 0) ? atk.replace(/[^\d\-]/gi, '') : atk.trim()) ;
						if ((i > 0) && (atk.trim().split(" ").length > 1)) {
							let tmparr = atk.trim().split(" ");
							let i = 0;
							for (i = 1; i < tmparr.length; i++) {
								update[`${repsec}${newrowid}_atkdesc`] += " " + tmparr[i];
							}
						}
						i++;
					}
				});
				update[`${repsec}${newrowid}_multipleatk_flag`] = (i > 2) ? 1 : 0;

				// Range ???

				// Damage, critical range and more
				let dmgparts = dmgstr.split("/");
				if (dmgparts.length) {
					// Base damage
					update[`${repsec}${newrowid}_dmgflag`] = 1;
					_.each(dmgparts, (part) => {
						if (part) {
							part = part.trim();
							if (part.match(/^\d\d20/g)) { // Compendium bad raking like 1920
								update[`${repsec}${newrowid}_atkcritrange`] = part.substring(0,2);
								update[`${repsec}${newrowid}_dmgtype`] += " " + part.replace(part.match(/^\d\d20/g)[0],'').replace(/^\s*\;/,"").trim();
							} else if (part.match(/\d+\-20/g)) {
								// Crit range
								update[`${repsec}${newrowid}_atkcritrange`] = part.match(/\d+\-20/g)[0].match(/\d+/g)[0];
								update[`${repsec}${newrowid}_dmgtype`] += " " + part.replace(part.match(/\d+\-20/g)[0],'').replace(/^\s*\;/,"").trim();
							} else if (part.match(/[x×]\d+/g)) {
								// Crit mulitplier
								update[`${repsec}${newrowid}_dmgcritmulti`] = part.match(/[x×]\d+/g)[0].match(/\d+/g)[0];
								update[`${repsec}${newrowid}_dmgtype`] += " " + part.replace(part.match(/[x×]\d+/g)[0],'').replace(/^\s*\;/,"").trim();
							} else {
								// base damage
								if (part.match(/\d+d*\d*\+*\-*\d*/g)) {
									update[`${repsec}${newrowid}_dmgbase`] = part.match(/\d+d*\d*\+*\-*\d*/g)[0];
									update[`${repsec}${newrowid}_dmgtype`] += " " + part.replace(update[`${repsec}${newrowid}_dmgbase`],'').replace(/^\s*\;/,"").trim();
								} else {
									update[`${repsec}${newrowid}_dmgtype`] += " " + part.replace(/^\s*\;/,"").trim();
									update[`${repsec}${newrowid}_dmgbase`] = "0";
								}
							}
						}
					});
					// Notes or Type final
					update[`${repsec}${newrowid}_dmgtype`] = update[`${repsec}${newrowid}_dmgtype`].trim();
				}
				// Misc
				update[`${repsec}${newrowid}_options_flag`] = 0;
				update[`${repsec}${newrowid}_atkdesc`] = update[`${repsec}${newrowid}_atkdesc`].trim();
				if (update[`${repsec}${newrowid}_atkdesc`].length) {
					update[`${repsec}${newrowid}_descflag`] = `{{descflag=[[1]]}} {{desc=@{atkdesc}}}`;
				}
				let tmpvalues = {};
				_.extend(tmpvalues,values,update);
				tmpvalues["npc"] = "1";
				_.extend(update,calc_npc_attack(type,newrowid,tmpvalues));
			});
			// console.log("*** DEBUG npc_attack_parser update: " + JSON.stringify(update,null,"  "));
			return update;
		};
		const npcdrop_add_special_attacks = function(objs) {
			// console.log("*** DEBUG npcdrop_add_special_attacks objs: " + JSON.stringify(objs,null,"  "));
			var update = {};
			var repsec = "repeating_npcatk-special_";
			_.each(objs, (obj) => {
				var newrowid = generateRowID();
				if (obj["Name"]) { //atkname
					update[`${repsec}${newrowid}_atkname`] = obj["Name"];
					update[`${repsec}${newrowid}_options_flag`] = 0;
				}
				if (obj["Per Day"]) {
					update[`${repsec}${newrowid}_perday_max`] = parseInt(obj["Per Day"]) || 1;
				}
				if (obj["Attack Bonus"]) { // atkmod
					update[`${repsec}${newrowid}_atkflag`] = `{{attack=1}} {{roll=[[1d20cs>@{atkcritrange}+@{atkmod} [Mod]+@{rollmod_attack} [Query]]]}} {{critconfirm=[[1d20cs20+@{atkmod} [Mod]+@{rollmod_attack} [Query]]]}}`;
					update[`${repsec}${newrowid}_atkmod`] = obj["Attack Bonus"].replace(/[^\d\-]/gi, '');
				} else {
					update[`${repsec}${newrowid}_atkflag`] = "0";
				}
				if (obj["Critical Range"]) {
					update[`${repsec}${newrowid}_atkcritrange`] = parseInt(obj["Critical Range"].replace(/[^\d]/gi, '')) || 20;
				} else {
					update[`${repsec}${newrowid}_atkcritrange`] = 20;
				}
				if (obj["Range"]) {
					update[`${repsec}${newrowid}_rangeflag`] = "{{range=@{atkrange}}}";
					update[`${repsec}${newrowid}_atkrange`] = obj["Range"];
				}
				if (obj["Area"]) {
					update[`${repsec}${newrowid}_areaflag`] = "{{area=@{atkarea}}}";
					update[`${repsec}${newrowid}_atkarea`] = obj["Area"];
				}
				if (obj["Effect"]) {
					update[`${repsec}${newrowid}_effectflag`] = "{{effect=@{atkeffect}}}";
					update[`${repsec}${newrowid}_atkeffect`] = obj["Effect"];
				}
				if (obj["Saving Throw"]) {
					update[`${repsec}${newrowid}_atksave`] = obj["Saving Throw"];
					if (obj["Saving Throw"].toLowerCase().trim() == "none") {
						update[`${repsec}${newrowid}_atksaveflag`] = "0";
					} else {
						update[`${repsec}${newrowid}_atksaveflag`] = "{{save=1}} {{savedc=@{atkdc}}}{{saveeffect=@{atksave}}}";
					}
				} else {
					update[`${repsec}${newrowid}_atksave`] = " ";
				}
				if (obj["Saving Throw DC"]) {
					if (! update[`${repsec}${newrowid}_atksaveflag`]) {
						update[`${repsec}${newrowid}_atksaveflag`] = "{{save=1}} {{savedc=@{atkdc}}}{{saveeffect=@{atksave}}}";
					}
					update[`${repsec}${newrowid}_atkdc`] = parseInt(obj["Saving Throw DC"].replace(/[^\d\-]/gi, '')) || 0;
				}
				if (obj["Damage 1"]) {
					update[`${repsec}${newrowid}_dmgflag`] = "{{damage=1}} {{dmg1flag=1}} {{dmg1=[[@{dmgbase} [Mod]+@{rollmod_damage} [Query]]]}} {{dmg1type=@{dmgtype}}} {{dmg1crit=[[(@{dmgbase} [Mod]+@{rollmod_damage} [Query])*@{dmgcritmulti}]]}}";
					update[`${repsec}${newrowid}_dmgbase`] = obj["Damage 1"];
				}
				if (obj["Damage 1 Notes or Type"]) {
					update[`${repsec}${newrowid}_dmgtype`] = obj["Damage 1 Notes or Type"];
				}
				if (obj["Damage 1 Critical Multiplier"]) {
					update[`${repsec}${newrowid}_dmgcritmulti`] = parseInt(obj["Damage 1 Critical Multiplier"].toLowerCase().replace("x","")) || 2;
				}
				if (obj["Damage 2"]) {
					update[`${repsec}${newrowid}_dmg2flag`] = "{{damage=1}} {{dmg2flag=1}}{{dmg2=[[@{dmg2base} [Mod]+@{rollmod_damage} [Query]]]}} {{dmg2type=@{dmg2type}}} {{dmg2crit=[[(@{dmg2base} [Mod]+@{rollmod_damage} [Query])*@{dmg2critmulti}]]}}";
					update[`${repsec}${newrowid}_dmg2base`] = obj["Damage 2"];
				}
				if (obj["Damage 2 Notes or Type"]) {
					update[`${repsec}${newrowid}_dmg2type`] = obj["Damage 2 Notes or Type"];
				}
				if (obj["Damage 2 Critical Multiplier"]) {
					update[`${repsec}${newrowid}_dmg2critmulti`] = parseInt(obj["Damage 2 Critical Multiplier"].toLowerCase().replace("x","")) || 2;
				}
				if (obj["Description"]) {
					update[`${repsec}${newrowid}_descflag`] = "{{descflag=[[1]]}} {{desc=@{atkdesc}}}";
					update[`${repsec}${newrowid}_atkdesc`] = obj["Description"];
				}
			});
			if (! _.isEmpty(update)) {
				update["specialattacks_flag"] = 1;
			} else {
				update["specialattacks_flag"] = 0;
			}
			// console.log("*** DEBUG npcdrop_add_special_attacks update: " + JSON.stringify(update,null,"  "));
			return update;
		};
		const npcdrop_add_specabs = function(objs) {
			// console.log("*** DEBUG npcdrop_add_specabs objs: " + JSON.stringify(objs,null,"  "));
			var update = {};
			var repsec = "repeating_abilities_";
			_.each(objs, (obj) => {
				var newrowid = generateRowID();
				if (obj["Name"]) {
					update[`${repsec}${newrowid}_name`] = obj["Name"];
					update[`${repsec}${newrowid}_options_flag`] = 0;
					update[`${repsec}${newrowid}_fromcompendium`] = obj["Name"];
				}
				if (obj["Type"]) {
					update[`${repsec}${newrowid}_type`] = obj["Type"];
				}
				if (obj["Description"]) {
					update[`${repsec}${newrowid}_descflag`] = "{{descflag=[[1]]}} {{desc=@{description}}}";
					update[`${repsec}${newrowid}_description`] = obj["Description"];
				}
			});
			if (! _.isEmpty(update)) {
				update["special_abilities_flag"] = 1;
			} else {
				update["special_abilities_flag"] = 0;
			}
			// console.log("*** DEBUG npcdrop_add_specabs update :" + JSON.stringify(update,null,"  "));
			return update;
		};
		const calc_npc_skill_display = function(skill,value,note) {
			var update = {};
			var display = "";
			var flag = 0;
			var intval = parseInt(value) || 0;
			if (intval != 0 ) {
				display += (intval >= 0) ? ("+" + intval) : ("" + intval);
				flag = 1;
			}
			if (note && (note.length > 0)) {
				if (display.length === 0) {display += "+0";}
				display += " (" + note + ")";
				flag = 1;
			}
			update[skill + "_display"] = display;
			update[skill + "_flag"] = flag;
			return update;
		};
		const update_special_ability_display = function(value, hash) {
			getAttrs(["npc"], (v) => {
				let u = {}, s = value === undefined ? "" : getTranslationByKey(value);
				u[hash + "type"] = s;
				u[hash + "type_display"] = s;
				setAttrs(u, {silent: true});
			});
		};
		const update_default_token = function() {
			// Token default attributes handling
			getAttrs(["hp_max","ac","size","cd_bar1_v","cd_bar1_m","cd_bar1_l","cd_bar2_v","cd_bar2_m","cd_bar2_l","cd_bar3_v","cd_bar3_m","cd_bar3_l"], (v) => {
				// TOKEN handling
				var default_attr = {};
				default_attr["width"] = 70;
				default_attr["height"] = 70;
				if (v["size"]) {
					var squares = 1.0;
					var squarelength = 70;
					var obj_size = pfoglobals_size.find((size_item) => size_item.size === v["size"]);
					if (! _.isEmpty(obj_size)) {
						squares = Math.max((parseFloat(obj_size.squares) || 1.0), 1.0);
					}
					let squaresize = parseInt(squarelength * squares);
					default_attr["width"] = squaresize;
					default_attr["height"] = squaresize;
				}
				var getList = {};
				for (x = 1; x <= 3; x++) {
					_.each(["v", "m"], (letter) => {
						var keyname = "cd_bar" + x + "_" + letter;
						if (v[keyname]) {
							getList[keyname] = v[keyname];
						}
					});
				}
				getAttrs(_.values(getList), (values) => {
					_.each(_.keys(getList), (keyname) => {
						v[keyname] = values[getList[keyname]] == undefined ? "" : values[getList[keyname]];
					});
					if (v["cd_bar1_l"]) {default_attr["bar1_link"] = v["cd_bar1_l"];}
					else if (v["cd_bar1_v"] || v["cd_bar1_m"]) {
						if (v["cd_bar1_v"]) {default_attr["bar1_value"] = v["cd_bar1_v"];}
						if (v["cd_bar1_m"]) {default_attr["bar1_max"] = v["cd_bar1_m"];}
					} else {
						default_attr["bar1_value"] = v["hp_max"];
						default_attr["bar1_max"] = v["hp_max"];
					}
					if (v["cd_bar2_l"]) {default_attr["bar2_link"] = v["cd_bar2_l"];}
					else if (v["cd_bar2_v"] || v["cd_bar2_m"]) {
						if (v["cd_bar2_v"]) {default_attr["bar2_value"] = v["cd_bar2_v"];}
						if (v["cd_bar2_m"]) {default_attr["bar2_max"] = v["cd_bar2_m"];}
					}
					else {default_attr["bar2_link"] = "ac";}
					if (v["cd_bar3_l"]) {default_attr["bar3_link"] = v["cd_bar3_l"];}
					else if (v["cd_bar3_v"] || v["cd_bar3_m"]) {
						if (v["cd_bar3_v"]) {default_attr["bar3_value"] = v["cd_bar3_v"];}
						if (v["cd_bar3_m"]) {default_attr["bar3_max"] = v["cd_bar3_m"];}
					}
					setDefaultToken(default_attr);
				});
			});
		};

// =============================================================================
// -----------------------------------------------------------------------------
// # Module : COMPENDIUM PC DROPS
// -----------------------------------------------------------------------------
// =============================================================================

		const pc_drop_handler = function(cdata, v) {
			getAttrs(["pcdrop_name","pcdrop_uniq","pcdrop_category","pcdrop_content","size","caster1_flag","caster2_flag","class1_name","class2_name"], (v) => {
				if (!("Name" in cdata)) {
					cdata["Name"] = (v.pcdrop_name || "");
				}
				if (!("uniqueName" in cdata)) {
					cdata["uniqueName"] = (v.pcdrop_uniq || "");
				}
				if (!("Category" in cdata)) {
					cdata["Category"] = (v.pcdrop_category || "");
				}
				if (!("Content" in cdata)) {
					cdata["Content"] = (v.pcdrop_content || "");
				}
				// What do to?
				let objs = [];
				let page = {};
				let pages = [];
				let update = {};
				let callbacks = [];
				update["pcdrop_name"] = "";
				update["pcdrop_uniq"] = "";
				update["pcdrop_category"] = "";
				update["pcdrop_data"] = "";
				update["pcdrop_content"] = "";
				switch((cdata["Category"] || "").toLowerCase()) {
					case "spells":
						if (((v.caster1_flag || "0") == "1") || ((v.caster2_flag || "0") == "1")) {
							let caster = "0", level, nb = 0, i = 0, j = 0;
							// Detecting class name in spell classes & levels
							let cl1arr = (v.class1_name || "unkownclass").trim().toLowerCase().replace(/\s+/," ").split(" ");
							let cl2arr = (v.class2_name || "unkownclass").trim().toLowerCase().replace(/\s+/," ").split(" ");
							_.each((cdata["Level"] || "").toLowerCase().replace(/\//g," ").split(","), (lvl) => {
								let lvlarr = lvl.trim().replace(/\s+/," ").split(" ");
								for (j = 0; j < lvlarr.length; j++) {
									for (i = 0; i < cl1arr.length; i++) {
										if (cl1arr[i] == lvlarr[j]) {
											if (caster == "0") {
												caster = "1";
												level = (lvl.replace(/[^\d]+/g, "") || "0");
											}
											nb++;
										}
									}
									for (i = 0; i < cl2arr.length; i++) {
										if (cl2arr[i] == lvlarr[j]) {
											if (caster == "0") {
												caster = "2";
												level = (lvl.replace(/[^\d]+/g, "") || "0");
											}
											nb++;
										}
									}
								}
							});
							if ((caster == "0") || (nb > 1)) {
								startCharactermancer("spell-choose");
							} else {
								pc_drop_spell(level,caster);
							}
						}
						break;
					case "feats":
						objs.push((v.pcdrop_name || ""));
						page["name"] = (v.pcdrop_name || "");
						page["id"] = (v.pcdrop_uniq || "");
						page["data"] = cdata;
						pages.push(page);
						_.extend(update,drop_add_feats(objs,pages, true));
						setAttrs(update,{silent: true});
						break;
					case "items":
						// Gear item
						_.extend(update,drop_add_item(cdata,v));
						callbacks.push(function() {update_gear_weight_total();});
						if ("Weapon Category" in cdata) {
							// Weapon item
							_.extend(update,drop_add_attack(cdata,v));
						}
						if ("Armor Category" in cdata) {
							// AC item
							_.extend(update,drop_add_armor(cdata,v));
							callbacks.push(function() {update_ac_items();});
						}
						// console.log("*** DEBUG pc_drop_handler:update: " + JSON.stringify(update,null,"  "));
						setAttrs(update,{silent: true},() => {
							if (callbacks.length) {
								_.each(callbacks, (callback) => {
									callback();
								});
							}
						});
						break;
				}
			});
		};
		const pc_drop_spell = function(level = "0", caster = "1") {
			let fields = [];
			fields = ["pcdrop_name","pcdrop_uniq","pcdrop_category","pcdrop_data","pcdrop_content","caster1_flag","caster2_flag","npc"].concat(pfoglobals_spell_fields,pfoglobals_babs_fields,pfoglobals_abilities);
			getAttrs(fields, (v) => {
				let update = {}, objs = [], obj = {}, pages = [], page = {}, tmpupd = {}, spellid;

				page["name"] = v.pcdrop_name;
				page["id"] = v.pcdrop_uniq;
				page["data"] = JSON.parse(v.pcdrop_data);
				page["content"] = (v.pcdrop_content || "");
				pages.push(page);

				update["pcdrop_name"] = "";
				update["pcdrop_uniq"] = "";
				update["pcdrop_category"] = "";
				update["pcdrop_data"] = "";
				update["pcdrop_content"] = "";

				if (level == "like") {
					obj["Name"] = v.pcdrop_name;
					obj["Frequency"] = "At Will";
					obj["Spell-source"] = v.pcdrop_name;
					objs.push(obj);

					tmpupd = pfom.drop_add_spellike(objs,pages,v,true);
					spellid = Object.keys(tmpupd)[0].substring(21, 41);
				} else {
					obj["name"] = v.pcdrop_name;
					obj["level"] = level;
					obj["spellcaster"] = caster;
					objs.push(obj);

					tmpupd = pfom.drop_add_spells(objs,pages,v,true);
					spellid = Object.keys(tmpupd)[0].substring(18, 38);
				}
				_.extend(update,tmpupd);

				setAttrs(update, {silent: true}, () => {
					pfom.update_spells(level,spellid);
				});
			});
		};
		const drop_add_feats = function(objs,cdatarr, isPc = false) {
			// console.log("*** DEBUG drop_add_feats objs :" + JSON.stringify(objs,null,"  "));
			let update = {};
			// return update;
			let repsec = "_";
			_.each(objs, (obj) => {
				let featObj = {};
				let newrowid = generateRowID();
				let featname = "";
				let featname2 = "";
				let featRepsec = "repeating_feats";
				featname = obj.trim().replace("Feats:","").trim();
				if (obj.indexOf("(") != -1) {
					featname2 = obj.split("(")[0].trim().replace("Feats:","").trim();
				}
				featObj[`${repsec}${newrowid}_name`] = featname;
				featObj[`${repsec}${newrowid}_options_flag`] = 0;
				featObj[`${repsec}${newrowid}_type`] = "misc";
				if (! _.isEmpty(cdatarr)) {
					let cdata = cdatarr.find(o => ((o.data) && (o.data["Feat Name"]) && (o.data["Feat Name"].toLowerCase().trim() === featname.toLowerCase()) && (o.data["Category"] === "Feats")));
					if ((!(cdata && cdata.id && cdata.data)) && featname2.length) {
						// console.log("*** DEBUG drop_add_feats 2nd search with: " + featname2);
						cdata = cdatarr.find(o => ((o.data) && (o.data["Feat Name"]) && (o.data["Feat Name"].toLowerCase().trim() === featname2.toLowerCase()) && (o.data["Category"] === "Feats")));
					}
					if (cdata && cdata.id && cdata.data) {
						// console.log("*** DEBUG drop_add_feats cdata: " + JSON.stringify(cdata,null,"  "));
						if (cdata.data["Feat Name"]) {
							featObj[`${repsec}${newrowid}_fromcompendium`] = "Feats:" + cdata["name"];
						}
						if (cdata.data["Feat Type"]) {
							let featType = cdata.data["Feat Type"].toLowerCase().trim();
							if (["general","combat","critical","grit","item-creation","metamagic","monster","panache","performance","style","teamwork"].includes(featType)) {
								featObj[`${repsec}${newrowid}_type`] = featType;
								if ((featType == "metamagic") && isPc) {
									featRepsec = "repeating_metamagic";
								}
							} else {
								featObj[`${repsec}${newrowid}_type`] = "misc";
							}
						}
						if (cdata.data["Prerequisites"]) {
							featObj[`${repsec}${newrowid}_prerequisites`] = cdata.data["Prerequisites"];
						}
						if (cdata.data["Benefit"]) {
							featObj[`${repsec}${newrowid}_benefits`] = cdata.data["Benefit"];
						}
						if (cdata.data["Normal"]) {
							featObj[`${repsec}${newrowid}_normal`] = cdata.data["Normal"];
						}
						if (cdata.data["data-description"]) {
							featObj[`${repsec}${newrowid}_description`] = cdata.data["data-description"];
						} else if (cdata["content"]) {
							featObj[`${repsec}${newrowid}_description`] = cdata["content"];
						}
					}
					// else
					// console.log("*** DEBUG drop_add_feats feat not found with " + featname + " or " + featname2 + " in " + JSON.stringify(cdatarr,null,"  "));
				}
				_.each(Object.keys(featObj),(key) => {
					update[featRepsec + key] = featObj[key];
				});
			});
			// console.log("*** DEBUG drop_add_feats update :" + JSON.stringify(update,null,"  "));
			return update;
		};
		const drop_add_spells = function(objs, cdatarr, values, isPc = false) {
			// console.log("*** DEBUG drop_add_spells objs: " + JSON.stringify(objs,null,"  "));
			let update = {};
			let baserepsec = "repeating_spell";
			_.each(objs, (obj) => {
				if (obj.name) {
					let newrowid = generateRowID();
					let level = 0;
					if (obj.level) {
						level = parseInt(obj.level) || 0;
					}
					let repsec = `${baserepsec}-${level}_`;
					update[`${repsec}${newrowid}_spellname`] = toTitleCase(obj.name.replace("Spells:",""));
					if (obj.domain) {
						if (isPc) {
							update[`${repsec}${newrowid}_spelldomainflag`] = 1;
						} else {
							update[`${repsec}${newrowid}_spellname`] += " (D)";
						}
					}
					update[`${repsec}${newrowid}_options_flag`] = 0;
					if (obj.spellcaster) {
						update[`${repsec}${newrowid}_spellcaster`] = obj.spellcaster;
					} else {
						update[`${repsec}${newrowid}_spellcaster`] = 1;
					}
					if (! _.isEmpty(cdatarr)) {
						let cdata = cdatarr.find(o => ((o.name) && (o.name.toLowerCase().trim() === obj.name.replace("Spells:","").toLowerCase().trim()) && (o.data["Category"] === "Spells")));
						// console.log("*** DEBUG drop_add_spells cdata :" + JSON.stringify(cdata,null,"  "));
						if (cdata && cdata.id && cdata.data) {
							update[`${repsec}${newrowid}_fromcompendium`] = "Spells:" + cdata["name"];
							if (cdata.data["School"]) {
								update[`${repsec}${newrowid}_spellschool`] = cdata.data["School"];
							}
							if (cdata.data["Level"]) {
								update[`${repsec}${newrowid}_spellclasslevel`] = cdata.data["Level"];
							}
							if (cdata.data["Casting Time"]) {
								update[`${repsec}${newrowid}_spellcastingtime`] = cdata.data["Casting Time"];
							}
							if (cdata.data["Components"]) {
								update[`${repsec}${newrowid}_spellcomponent`] = cdata.data["Components"];
							}
							if (cdata.data["Range"]) {
								update[`${repsec}${newrowid}_spellrange`] = cdata.data["Range"];
							}
							if (cdata.data["Area"]) {
								update[`${repsec}${newrowid}_spellarea`] = cdata.data["Area"];
							}
							if (cdata.data["Target"]) {
								update[`${repsec}${newrowid}_spelltargets`] = cdata.data["Target"];
							}
							if (cdata.data["Effect"]) {
								update[`${repsec}${newrowid}_spelleffect`] = cdata.data["Effect"];
							}
							if (cdata.data["Duration"]) {
								update[`${repsec}${newrowid}_spellduration`] = cdata.data["Duration"];
							}
							if (cdata.data["Saving Throw"]) {
								update[`${repsec}${newrowid}_spellsave`] = cdata.data["Saving Throw"];
								if (cdata.data["Saving Throw"].toLowerCase().trim() == "none") {
									update[`${repsec}${newrowid}_spellsaveflag`] = 0;
								} else {
									update[`${repsec}${newrowid}_spellsaveflag`] = "{{save=1}}";
								}
							} else {
								update[`${repsec}${newrowid}_spellsave`] = " ";
							}
							if (obj.dc) {
								if (! update[`${repsec}${newrowid}_spellsaveflag`]) {
									update[`${repsec}${newrowid}_spellsaveflag`] = "{{save=1}}";
								}
								update[`${repsec}${newrowid}_spelldc_mod`] = parseInt(String(obj.dc).replace(/[^\d]/gi, '')) || 0;
							}
							if (cdata.data["Spell Resistance"]) {
								update[`${repsec}${newrowid}_spellresistance`] = cdata.data["Spell Resistance"];
								if (cdata.data["Spell Resistance"].toLowerCase().trim() == "no") {
									update[`${repsec}${newrowid}_spellresistanceflag`] = "0";
								} else {
									update[`${repsec}${newrowid}_spellresistanceflag`] = "{{sr=1}}";
								}
							}
							if (cdata.data["Spell Attack"]) {
								update[`${repsec}${newrowid}_spellatkflag`] = "{{attack=1}}";
								if (cdata.data["Spell Attack"].toLowerCase().indexOf("ranged touch") != -1) {
									update[`${repsec}${newrowid}_spellatktype`] = "ranged";
								} else if (cdata.data["Spell Attack"].toLowerCase().indexOf("touch") != -1) {
									update[`${repsec}${newrowid}_spellatktype`] = "melee";
								}
							}
							if (cdata.data["Spell Damage"]) {
								update[`${repsec}${newrowid}_spelldmgflag`] = "{{damage=1}} {{dmg1flag=1}}";
								update[`${repsec}${newrowid}_spelldmg`] = parse_compendium_formula((cdata.data["Spell Damage"] || ""), (obj.spellcaster || "1"), false);
							}
							if (cdata.data["Spell Damage Type"]) {
								update[`${repsec}${newrowid}_spelldmgtype`] = cdata.data["Spell Damage Type"];
							}
							if (cdata.data["Secondary Spell Damage"]) {
								update[`${repsec}${newrowid}_spelldmg2flag`] = "{{damage=1}} {{dmg2flag=1}}";
								update[`${repsec}${newrowid}_spelldmg2`] = cdata.data["Secondary Spell Damage"];
							}
							if (cdata.data["Secondary Spell Damage Type"]) {
								update[`${repsec}${newrowid}_spelldmg2type`] = cdata.data["Secondary Spell Damage Type"];
							}
							if (cdata["content"]) {
								update[`${repsec}${newrowid}_spelldesc`] = parse_compendium_formula((cdata["content"] || ""), (obj.spellcaster || "1"), true);
								update[`${repsec}${newrowid}_spelldescflag`] = "{{descflag=[[1]]}}";
							}
						}
					}
					let tmpvalues = {};
					_.extend(tmpvalues,values,update);
					if (! isPc) {
						tmpvalues["npc"] = "1";
					}
					_.extend(update,calc_spell(level,newrowid,tmpvalues));
				}
			});
			// console.log("*** DEBUG drop_add_spells update: " + JSON.stringify(update,null,"  "));
			return update;
		};
		const drop_add_spellike = function(objs, cdatarr, values, isPc = false) {
			// console.log("*** DEBUG drop_add_spellike: " + JSON.stringify(objs,null,"  "));
			let update = {};
			let repsec = "repeating_spell-like_";
			_.each(objs, (obj) => {
				if (obj["Name"]) {
					// console.log("*** DEBUG drop_add_spellike obj :" + JSON.stringify(obj,null,"  "));
					let newrowid = generateRowID();
					update[`${repsec}${newrowid}_spellname`] = obj["Name"];
					update[`${repsec}${newrowid}_options_flag`] = 0;
					if (isPc) {
						if (obj["Per-day"]) {
							update[`${repsec}${newrowid}_timesperday`] = "per-day";
							let perday = 0;
							if (obj["Per-day"].indexOf("+") == -1) {
								perday = parseInt(obj["Per-day"]) || 1;
							} else {
								perday = (parseInt(obj["Per-day"].split("+")[0].replace(/[^\d]/gi, "").trim()) || 1) + (parseInt(values[obj["Per-day"].split("+")[1].replace("modifier", "").trim().toLowerCase() + "_mod"]) || 0);
							}
							if (perday > 0) {
								update[`${repsec}${newrowid}_perday`] = 0;
								update[`${repsec}${newrowid}_perday_max`] = perday;
								update[`${repsec}${newrowid}_perday_qty`] = perday;
							}
						} else {
							update[`${repsec}${newrowid}_timesperday`] = "at-will";
						}
					} else {
						if (obj["Frequency"]) {
							if (obj["Frequency"].toLowerCase().trim() == "constant") {
								update[`${repsec}${newrowid}_timesperday`] = "constant";
							} else if (obj["Frequency"].toLowerCase().trim() == "at will") {
								update[`${repsec}${newrowid}_timesperday`] = "at-will";
							} else if (obj["Frequency"].toLowerCase().trim() == "per hour") {
								update[`${repsec}${newrowid}_timesperday`] = "per-hour";
							} else if (obj["Frequency"].toLowerCase().trim() == "per day") {
								update[`${repsec}${newrowid}_timesperday`] = "per-day";
							} else if (obj["Frequency"].toLowerCase().trim() == "per week") {
								update[`${repsec}${newrowid}_timesperday`] = "per-week";
							} else if (obj["Frequency"].toLowerCase().trim() == "per month") {
								update[`${repsec}${newrowid}_timesperday`] = "per-month";
							} else if (obj["Frequency"].toLowerCase().trim() == "per year") {
								update[`${repsec}${newrowid}_timesperday`] = "per-year";
							} else if (obj["Frequency"].toLowerCase().trim() == "every x hours") {
								update[`${repsec}${newrowid}_timesperday`] = "every-hours";
							} else { // default
								update[`${repsec}${newrowid}_timesperday`] = "at-will";
							}
							if (obj["Occurences"] || obj["Occurrences"]) { // in case of typo
								update[`${repsec}${newrowid}_perday_max`] = parseInt(obj["Occurrences"]) || parseInt(obj["Occurences"]) || 0;
								update[`${repsec}${newrowid}_perday_qty`] = update[`${repsec}${newrowid}_perday_max`];
							}
						}
					}
					// getting data from Spell source of the ability, if any
					if (obj["Spell"] || obj["Spell-source"]) {
						if (! _.isEmpty(cdatarr)) {
							let zespell = "";
							if (isPc) {
								zespell = obj["Spell-source"];
							} else {
								zespell = obj["Spell"];
							}
							var cdata = cdatarr.find(o => ((o.name) && (o.name.toLowerCase().trim() === zespell.toLowerCase().trim()) && (o.data["Category"] === "Spells")));
							if (cdata && cdata.id && cdata.data) {
								update[`${repsec}${newrowid}_fromcompendium`] = `Spells:${cdata["name"]}`;
								if (obj["School"]) {
									update[`${repsec}${newrowid}_spellschool`] = obj["School"];
								} else if (cdata.data["School"]) {
									update[`${repsec}${newrowid}_spellschool`] = cdata.data["School"];
								}
								if (obj["Level"]) {
									update[`${repsec}${newrowid}_spellclasslevel`] = obj["Level"];
								} else if (cdata.data["Level"]) {
									update[`${repsec}${newrowid}_spellclasslevel`] = cdata.data["Level"];
								}
								if (obj["Casting Time"]) {
									update[`${repsec}${newrowid}_spellcastingtime`] = obj["Casting Time"];
								} else if (cdata.data["Casting Time"]) {
									update[`${repsec}${newrowid}_spellcastingtime`] = cdata.data["Casting Time"];
								}
								if (obj["Range"]) {
									update[`${repsec}${newrowid}_spellrange`] = obj["Range"];
								} else if (cdata.data["Range"]) {
									update[`${repsec}${newrowid}_spellrange`] = cdata.data["Range"];
								}
								if (obj["Area"]) {
									update[`${repsec}${newrowid}_spellarea`] = obj["Area"];
								} else if (cdata.data["Area"]) {
									update[`${repsec}${newrowid}_spellarea`] = cdata.data["Area"];
								}
								if (obj["Target"]) {
									update[`${repsec}${newrowid}_spelltargets`] = obj["Target"];
								} else if (cdata.data["Target"]) {
									update[`${repsec}${newrowid}_spelltargets`] = cdata.data["Target"];
								}
								if (obj["Effect"]) {
									update[`${repsec}${newrowid}_spelleffect`] = obj["Effect"];
								} else if (cdata.data["Effect"]) {
									update[`${repsec}${newrowid}_spelleffect`] = cdata.data["Effect"];
								}
								if (obj["Duration"]) {
									update[`${repsec}${newrowid}_spellduration`] = obj["Duration"];
								} else if (cdata.data["Duration"]) {
									update[`${repsec}${newrowid}_spellduration`] = cdata.data["Duration"];
								}
								if (obj["Saving Throw"]) {
									update[`${repsec}${newrowid}_spellsave`] = obj["Saving Throw"];
								} else if (cdata.data["Saving Throw"]) {
									update[`${repsec}${newrowid}_spellsave`] = cdata.data["Saving Throw"];
								} else {
									update[`${repsec}${newrowid}_spellsave`] = " ";
								}
								if (update[`${repsec}${newrowid}_spellsave`]) {
									update[`${repsec}${newrowid}_spellsaveflag`] = (update[`${repsec}${newrowid}_spellsave`].toLowerCase().trim() == "none") ? "0" : "{{save=1}}";
								}
								if (obj["DC"]) {
									if (! update[`${repsec}${newrowid}_spellsaveflag`]) {
										update[`${repsec}${newrowid}_spellsaveflag`] = "{{save=1}}";
									}
									update[`${repsec}${newrowid}_spelldc_mod`] = parseInt(obj["DC"].replace(/[^\d]/gi, '')) || 0;
								}
								if (obj["Spell Resistance"]) {
									update[`${repsec}${newrowid}_spellresistance`] = obj["Spell Resistance"];
								} else if (cdata.data["Spell Resistance"]) {
									update[`${repsec}${newrowid}_spellresistance`] = cdata.data["Spell Resistance"];
								}
								if (update[`${repsec}${newrowid}_spellresistance`]) {
									update[`${repsec}${newrowid}_spellresistanceflag`] = (update[`${repsec}${newrowid}_spellresistance`].toLowerCase().trim() == "no") ? "0" : "{{sr=1}}";
								}
								if (obj["Spell Attack"]) {
									update[`${repsec}${newrowid}_spellatkmod`] = obj["Spell Attack"];
									update[`${repsec}${newrowid}_spellatkflag`] = "{{attack=1}}";
								} else if (cdata.data["Spell Attack"]) {
									update[`${repsec}${newrowid}_spellatkflag`] = "{{attack=1}}";
								}
								if (obj["Spell Damage"]) {
									update[`${repsec}${newrowid}_spelldmg`] = obj["Spell Damage"];
								} else if (cdata.data["Spell Damage"]) {
									update[`${repsec}${newrowid}_spelldmg`] = parse_compendium_formula((cdata.data["Spell Damage"] || ""), (obj.spellcaster || "1"), false);
								}
								if (update[`${repsec}${newrowid}_spelldmg`]) {
									update[`${repsec}${newrowid}_spelldmgflag`] = "{{damage=1}} {{dmg1flag=1}}";
								}
								if (obj["Spell Damage Type"]) {
									update[`${repsec}${newrowid}_spelldmgtype`] = obj["Spell Damage Type"];
								} else if (cdata.data["Spell Damage Type"]) {
									update[`${repsec}${newrowid}_spelldmgtype`] = cdata.data["Spell Damage Type"];
								}
								if (obj["Secondary Spell Damage"]) {
									update[`${repsec}${newrowid}_spelldmg2`] = obj["Secondary Spell Damage"];
								} else if (cdata.data["Secondary Spell Damage"]) {
									update[`${repsec}${newrowid}_spelldmg2`] = cdata.data["Secondary Spell Damage"];
								}
								if (update[`${repsec}${newrowid}_spelldmg2`]) {
									update[`${repsec}${newrowid}_spelldmg2flag`] = "{{damage=1}} {{dmg2flag=1}}";
								}
								if (obj["Secondary Spell Damage Type"]) {
									update[`${repsec}${newrowid}_spelldmg2type`] = obj["Secondary Spell Damage Type"];
								} else if (cdata.data["Secondary Spell Damage Type"]) {
									update[`${repsec}${newrowid}_spelldmg2type`] = cdata.data["Secondary Spell Damage Type"];
								}
								if (obj["content"]) {
									update[`${repsec}${newrowid}_spelldesc`] = parse_compendium_formula((obj["content"] || ""), (obj.spellcaster || "1"), true);
								} else if (cdata["content"]) {
									update[`${repsec}${newrowid}_spelldesc`] = parse_compendium_formula((cdata["content"] || ""), (obj.spellcaster || "1"), true);
								}
								if (update[`${repsec}${newrowid}_spelldesc`]) {
									update[`${repsec}${newrowid}_spelldescflag`] = "{{descflag=[[1]]}}";
								}
							}
						}
					}
					// Completing or replacing data for PC (race/class/subclass feature)
					if (isPc) {
						if (obj["Type"]) {
							update[`${repsec}${newrowid}_spelltype`] = obj["Type"];
						}
						if (obj["Casting-time"]) {
							update[`${repsec}${newrowid}_spellcastingtime`] = obj["Casting-time"];
						}
						if (obj["Range"]) {
							update[`${repsec}${newrowid}_spellrange`] = obj["Range"];
						}
						if (obj["Area"]) {
							update[`${repsec}${newrowid}_spellarea`] = obj["Area"];
						}
						if (obj["Target"]) {
							update[`${repsec}${newrowid}_spelltargets`] = obj["Target"];
						}
						if (obj["Effect"]) {
							update[`${repsec}${newrowid}_spelleffect`] = obj["Effect"];
						}
						if (obj["Duration"]) {
							update[`${repsec}${newrowid}_spellduration`] = obj["Duration"];
						}
						if (obj["Save-DC"]) {
							let zedc = 0;
							if (obj["Save-DC"].indexOf("+") == -1) {
								zedc = parseInt(obj["Save-DC"].replace(/[^\d]/gi, '')) || 0;
							} else {
								_.each(obj["Save-DC"].split("+"),(elm) => {
									if (elm.toLowerCase().indexOf("modifier") != -1) {
										zedc += (parseInt(values[elm.replace("modifier", "").trim().toLowerCase() + "_mod"]) || 0);
									} else if (elm.toLowerCase().indexOf("level") != -1) {
										if (elm.toLowerCase().indexOf("1/2") == -1) {
											zedc += parseInt(values["level"]) || 0;
										}
									} else {
										zedc += (parseInt(elm.replace(/[^\d]/gi, "").trim()) || 0)
									}
								});
							}
							if (zedc > 0) {
								update[`${repsec}${newrowid}_spellsaveflag`] = "{{save=1}}";
								update[`${repsec}${newrowid}_spelldc`] = zedc;
							}
						}
						if (obj["Attack"]) {
							update[`${repsec}${newrowid}_spellatkflag`] = "{{attack=1}}";
							if (obj["Attack"].toLowerCase().indexOf("melee") != -1) {
								update[`${repsec}${newrowid}_spellatkmod`] = "@{melee_mod}[" + obj["Attack"] + "]";
							} else if (obj["Attack"].toLowerCase().indexOf("ranged") != -1) {
								update[`${repsec}${newrowid}_spellatkmod`] = "@{ranged_mod}[" + obj["Attack"] + "]";
							} else {
								update[`${repsec}${newrowid}_spellatkmod`] = obj["Attack"];
							}
						}
						if (obj["Damage"]) {
							update[`${repsec}${newrowid}_spelldmgflag`] = "{{damage=1}} {{dmg1flag=1}}";
							if (obj["Damage"].indexOf("+") == -1) {
								update[`${repsec}${newrowid}_spelldmg`] = obj["Damage"];
							} else {
								update[`${repsec}${newrowid}_spelldmg`] = obj["Damage"].split("+")[0];
								if (obj["Damage"].split("+")[1].toLowerCase().indexOf("for every two") != -1) {
									// 1d6 + 1 point for every two cleric levels
									update[`${repsec}${newrowid}_spelldmg`] += "+[[floor(@{caster1_level}/2)]]";
								} else {
									update[`${repsec}${newrowid}_spelldmg`] += obj["Damage"].split("+")[1].replace(/[^\d\-\+\s]/gi, "").trim();
								}
							}
						}
						if (obj["Damage-type"]) {
							update[`${repsec}${newrowid}_spelldmgtype`] = obj["Damage-type"];
						}
						if (obj["Description"]) {
							update[`${repsec}${newrowid}_spelldescflag`] = "{{descflag=[[1]]}}";
							update[`${repsec}${newrowid}_spelldesc`] = obj["Description"];
						}
					}
					// Final calculation
					var tmpvalues = {};
					_.extend(tmpvalues,update,values);
					if (! isPc) {
						tmpvalues["npc"] = "1";
					}
					_.extend(update,calc_spell("like",newrowid,tmpvalues));
				}
			});
			// console.log("*** DEBUG drop_add_spellike update :" + JSON.stringify(update,null,"  "));
			return update;
		};
		const drop_add_item = function(cdata,v) {
			let update = {}, repsec = `repeating_gear_${generateRowID()}_`;
			update[`${repsec}fromcompendium`] = cdata["uniqueName"];
			update[`${repsec}name`] = cdata["Name"];
			update[`${repsec}cost`] = (cdata["Cost"] || "");
			update[`${repsec}special`] = (cdata["Special"] || "");
			update[`${repsec}slot`] = ((cdata["Slot"] || "none").toLowerCase() == "none") ? "" : (cdata["Slot"] || "");
			update[`${repsec}quantity`] = 1;
			update[`${repsec}weight`] = parseInt((cdata["Weight"] || "0").replace(/\D+/g, ""));
			update[`${repsec}weight_total`] = update[`${repsec}weight`];
			update[`${repsec}notes`] = parse_compendium_formula((cdata["Content"] || ""),"1",true);
			return update;
		};
		const drop_add_armor = function(cdata,v) {
			let update = {}, repsec = `repeating_acitems_${generateRowID()}_`;
			update[`${repsec}fromcompendium`] = cdata["uniqueName"];
			update[`${repsec}name`] = cdata["Name"];
			update[`${repsec}ac_bonus`] = (parseInt(cdata["Armor/Shield Bonus"]) || 0);
			update[`${repsec}check_penalty`] = (parseInt(cdata["Armor Check Penalty"]) || 0);
			update[`${repsec}max_dex_bonus`] = (cdata["Maximum Dex Bonus"] || "-");
			update[`${repsec}spell_failure`] = (parseInt(cdata["Arcane Spell Failure Chance"]) || 0);
			update[`${repsec}speed20`] = (cdata["Speed 20ft."] || "");
			update[`${repsec}speed30`] = (cdata["Speed 30ft."] || "");
			if ((cdata["Armor Category"] || "").toLowerCase().includes("shield")) {
				update[`${repsec}type`] = "shield";
				update[`${repsec}run_factor`] = 4;
			} else if ((cdata["Armor Category"] || "").toLowerCase().includes("light")) {
				update[`${repsec}type`] = "light";
				update[`${repsec}run_factor`] = 4;
			} else if ((cdata["Armor Category"] || "").toLowerCase().includes("medium")) {
				update[`${repsec}type`] = "medium";
				update[`${repsec}run_factor`] = 4;
			} else if ((cdata["Armor Category"] || "").toLowerCase().includes("heavy")) {
				update[`${repsec}type`] = "heavy";
				update[`${repsec}run_factor`] = 3;
			}
			return update;
		};
		const drop_add_attack = function(cdata,v) {
			let update = {}, repsec = `repeating_attacks_${generateRowID()}_`;
			update[`${repsec}fromcompendium`] = cdata["uniqueName"];
			update[`${repsec}atkname`] = cdata["Name"];
			update[`${repsec}options_flag`] = 0;
			update[`${repsec}category`] = (cdata["Weapon Category"] || "");
			if (update[`${repsec}category`].toLowerCase().includes("ranged")) {
				update[`${repsec}atktype`] = "ranged";
				update[`${repsec}dmgattr`] = "0";
			} else {
				update[`${repsec}atktype`] = "melee";
				if (update[`${repsec}category`].toLowerCase().includes("two-handed")) {
					update[`${repsec}dmgattr`] = "strength_oneandahalf";
				} else {
					update[`${repsec}dmgattr`] = "strength";
				}
			}
			update[`${repsec}type`] = (cdata["Weapon Type"] || "");
			update[`${repsec}atkcritrange`] = (cdata["Critical Range"] || "20").substr(0,2);
			update[`${repsec}atkrange`] = (cdata["Range"] || "");
			if ("Damage (Medium)" in cdata && ["medium","large","huge","gargantuan","colossal"].includes((v.size || "medium"))) {
				update[`${repsec}dmgbase`] = cdata["Damage (Medium)"];
			}
			if ("Damage (Small)" in cdata && ["fine","diminutive","tiny","small"].includes((v.size || "medium"))) {
				update[`${repsec}dmgbase`] = cdata["Damage (Small)"];
			}
			update[`${repsec}dmgtype`] = (cdata["Damage Type"] || "");
			update[`${repsec}dmgcritmulti`] = (parseInt((cdata["Critical Damage"] || "").replace(/\D+/g, "")) || 2);
			update[`${repsec}notes`] = (cdata["Special"] || "");
			return update;
		};

// =============================================================================
// -----------------------------------------------------------------------------
// # Module : ATTRIBUTES
// -----------------------------------------------------------------------------
// =============================================================================

		// === ABILITIES & MODS
		const calc_ability = function(attr,v) {
			let update = {};
			let total = (parseInt(v[`${attr}_base`]) || 0) + (parseInt(v[`${attr}_race`]) || 0) + (parseInt(v[`${attr}_bonus`]) || 0);
			if (["strength","dexterity"].includes(attr)) {
				total += parseInt(v[`${attr}_condition`]) || 0;
			}
			update[attr] = Math.max(total,0);
			// Calculating base mod (for macro/dynmic roll usage)
			if (("npc" in v) && (v.npc != "1")) {
				update[`${attr}_base_mod`] = Math.floor(((parseInt(v[`${attr}_base`]) || 0) + (parseInt(v[`${attr}_race`]) || 0) - 10) / 2);
			}
			return update;
		};
		const update_mod = function(attr) {
			let fields = [attr];
			if (attr == "dexterity") {
				fields.push("dexterity_condition_nobonus");
			}
			getAttrs(fields, (v) => {
				setAttrs(calc_ability_mod(attr, v),{silent: true});
			});
		};
		const calc_ability_mod = function(attr, v) {
			let update = {};
			let mod = 0;
			if (String(v[attr]).replace(/[^\d]/gi, "") == "" ) {
				mod = 0;
			} else {
				mod = Math.floor(((parseInt(String(v[attr]).replace(/[^\d\-]/gi, "")) || 0) - 10) / 2);
				if (attr == "strength") {
					update["strength_half_mod"] = Math.floor(mod*0.5);
					update["strength_oneandahalf_mod"] = Math.floor(mod*1.5);
				} else if (attr == "dexterity") {
					if (v.dexterity_condition_nobonus) {
						if ( (v.dexterity_condition_nobonus == "1") && (mod > 0) ) {
							mod = 0;
						}
					}
					update["dexterity_half_mod"] = Math.floor(mod*0.5);
					update["dexterity_oneandahalf_mod"] = Math.floor(mod*1.5);
				}
			}
			update[attr + "_mod"] = mod;
			return update;
		};

		// === SIZE
		const update_size = function(psize) {
			// console.log("*** DEBUG update_size call: psize = " + psize);
			getAttrs(["npc"], (v) => {
				if (v.npc == "1") {
					var update = {};
					update["size_display"] = getTranslationByKey(psize);
					setAttrs(update, {silent: true});
				} else {
					setAttrs(calc_pc_size(psize),{silent: true}, () => {
						update_babs_all();
						pfom.update_skill("fly", ""); // NEW
						pfom.update_skill("stealth", ""); // NEW
						update_encumbrance(); // NEW
					});
				}
			});
		};
		const calc_pc_size = function(psize) {
			let atkac = 0, cmb = 0, fly = 0, stealth = 0, load = 1;
			let obj_size = pfoglobals_size.find((size_item) => size_item.size === (psize || "medium"));
			if (! _.isEmpty(obj_size)) {
				atkac = parseInt(obj_size.atkac) || 0;
				cmb = parseInt(obj_size.cmb) || 0;
				fly = parseInt(obj_size.fly) || 0;
				stealth = parseInt(obj_size.stealth) || 0;
				load = parseFloat(obj_size.load) || 1.0;
			}
			update = {"ac_size": atkac, "bab_size": atkac, "cmb_size": cmb, "fly_size": fly, "stealth_size": stealth, "encumbrance_size": load};
			// console.log("*** DEBUG calc_pc_size: psize = " + psize + " update = " + JSON.stringify(update,null,"  "));
			return update;
		};

		// === INITIATIVE
		const update_initiative = function () {
			getAttrs(pfoglobals_initiative_fields, (v) => {
				if (v.npc != "1") {
					setAttrs(calc_initiative(v));
				}
			});
		};
		const calc_initiative = function(v) {
			return {"initiative": (parseInt(v.dexterity_mod) || 0) + (parseInt(v.initiative_misc) || 0) + (parseInt(v.initiative_bonus) || 0)};
		};

		// === CLASS / MULTICLASSING / MULTICASTING
		const update_class_names = function(attr) {
			// console.log("*** DEBUG update_class_names call");
			let update = {};
			getAttrs(["npc","class1_name","class2_name","class3_name","caster1_flag","caster2_flag","class1_level","class2_level","class3_level"], (v) => {
				if (v.npc != "1") {
					let cls = "", cc1 = " ", cc2 = " ";
					if (v.class1_name) {
						if (v.class1_name.length > 0) {
							cls += v.class1_name;
							if (v.caster1_flag != "0") {cc1 = v.class1_name;}
						}
					}
					if (v.class2_name) {
						if (v.class2_name.length > 0) {
							cls += (cls.length > 0) ? (" " + (parseInt(v.class1_level) || 1) + ", ") : "";
							cls += v.class2_name + " " + (parseInt(v.class2_level) || 0);
							if (v.caster2_flag != "0") {cc2 = v.class2_name;}
						}
					}
					if (v.class3_name) {
						if (v.class3_name.length > 0) {
							cls += ((cls.length > 0) ? ", " : "") + v.class3_name + " " + (parseInt(v.class3_level) || 0);
						}
					}
					update["class"] = cls;
					update["caster1_class"] = cc1;
					update["caster2_class"] = cc2;
					update["caster_flag"] = (parseInt(v.caster1_flag) || 0) + (parseInt(v.caster2_flag) || 0);
					setAttrs(update, {silent: true}, () => {
						if ( (parseInt(update["caster_flag"]) || 0) > 0) {
							if (attr) {
								if (attr == "caster1_flag") {
									update_spells_dc("caster1_ability"); // => update_all_spells
								} else if (attr == "caster2_flag") {
									update_spells_dc("caster2_ability"); // => update_all_spells
								} else if ( ((parseInt(update["caster_flag"]) || 0) == 2) && (["class1_name","class2_name"].includes(attr)) ) {
									update_all_spells("all");
								}
							}
						}
					});
				}
			});
		};
		const update_class_numbers = function(attr) {
			// console.log("*** DEBUG update_class_numbers attr: " + attr);
			let update = {};
			getAttrs(["npc","class1_" + attr,"class2_" + attr,"class3_" + attr], (v) => {
				if (v.npc != "1") {
					let finalattr = "", total = 0, i = 0;
					for (i = 1; i < 4; i++) {
						total += (parseInt(v[`class${i}_${attr}`]) || 0);
					}
					if (["level","bab"].includes(attr)) {
						finalattr = attr;
					} else if (["speed"].includes(attr)) {
						finalattr = attr + "_class";
					} else {
						finalattr = attr + "_base";
					}
					if (attr == "bab") {
						update["bab_max"] = total;
					}
					update[finalattr] = total;
					setAttrs(update,{silent: false},() => {
						if (attr == "level") {
							update_class_names(attr);
							getAttrs(pfoglobals_babs_fields, (values) => {
								setAttrs(calc_fob(values),{silent: true},() => {
									update_attacks("all");
								});
							});
						}
					});
				}
			});
		};
		const update_hitdie = function(){
			// console.log("*** DEBUG update_hitdie");
			getAttrs(["class_favored","class1_hitdietype","class2_hitdietype","class3_hitdietype"], (v) => {
				setAttrs({"hitdietype": v["class" + (parseInt(v["class_favored"]) || 1) + "_hitdietype"]},{silent: true});
			});
		};

		// === AC / DEFENSE / SPELL RESISTANCE
		const update_ac_items = function(res) { // res = ressource
			// console.log("*** DEBUG update_ac_items");
			let attrs = ["speed_unit","speed_race","speed_class", "base_run_factor", "caster1_flag","caster2_flag","speed_armor","armor_run_factor","armor_check_penalty","armor_spell_failure"]; // EDIT
			getSectionIDs("repeating_acitems", (sec) => {
				_.each(sec, (id) => {
					attrs.push(
						`repeating_acitems_${id}_equipped`,
						`repeating_acitems_${id}_ac_bonus`,
						`repeating_acitems_${id}_flatfooted_bonus`,
						`repeating_acitems_${id}_touch_bonus`,
						`repeating_acitems_${id}_natural_bonus`,
						`repeating_acitems_${id}_deflection_bonus`,
						`repeating_acitems_${id}_dodge_bonus`,
						`repeating_acitems_${id}_type`,
						`repeating_acitems_${id}_check_penalty`,
						`repeating_acitems_${id}_max_dex_bonus`,
						`repeating_acitems_${id}_spell_failure`,
						`repeating_acitems_${id}_speed20`, // UNUSED -- kept for compendium
						`repeating_acitems_${id}_speed30`, // UNUSED -- kept for compendium
						`repeating_acitems_${id}_armor_speed_view_flag`,
						`repeating_acitems_${id}_armor_speed_reduced`,
						`repeating_acitems_${id}_armor_speed_max`,
						`repeating_acitems_${id}_run_factor_reduced`,
						`repeating_acitems_${id}_run_factor`,
						`repeating_acitems_${id}_speed_unit_long`
					);
				});
				getAttrs(attrs, (v) => {
					let update = {}, bonusarmor = 0, bonusshield = 0, bonusff = 0, bonustouch = 0, bonusnatural = 0, bonusdeflection = 0, bonusdodge = 0, checkpen = 0, maxdex = 99, spellf = 0, maxab = "-";
					let speedbase = (parseFloat(v.speed_race) || 30) + (parseFloat(v.speed_class) || 0); // EDIT
					let speedreduced = calc_reduced_speed(speedbase, v.speed_unit); // heavy and medium armor
					let speed = speedbase;
					let runbase = parseInt(v.base_run_factor);
					let runreduced = runbase - 1;
					let run = runbase;
					_.each(sec, (id) => {
						let view = ["light", "heavy","medium"].includes(v[`repeating_acitems_${id}_type`]) ? "1" : "0";
						update[`repeating_acitems_${id}_armor_speed_view_flag`] = view;
						let eqp = v[`repeating_acitems_${id}_equipped`] == "1";
						let spd_eqp = speedbase;
						let run_eqp = runbase;
						let resdef = res == `repeating_acitems_${id}_type`;
						if (eqp) {
							if (v[`repeating_acitems_${id}_type`] == "shield") {
								bonusshield += parseInt(v[`repeating_acitems_${id}_ac_bonus`]) || 0;
							} else {
								bonusarmor += parseInt(v[`repeating_acitems_${id}_ac_bonus`]) || 0;
							}
							bonusff += parseInt(v[`repeating_acitems_${id}_flatfooted_bonus`]) || 0;
							bonustouch += parseInt(v[`repeating_acitems_${id}_touch_bonus`]) || 0;
							bonusnatural = Math.max(bonusnatural, parseInt(v[`repeating_acitems_${id}_natural_bonus`]) || 0);
							bonusdeflection = Math.max(bonusdeflection, parseInt(v[`repeating_acitems_${id}_deflection_bonus`]) || 0);
							bonusdodge += parseInt(v[`repeating_acitems_${id}_dodge_bonus`]) || 0;
							checkpen += parseInt(v[`repeating_acitems_${id}_check_penalty`]) || 0;
							if ((v[`repeating_acitems_${id}_max_dex_bonus`] || "").replace(/[^\d]/gi, "").length) {
								maxdex = Math.min(maxdex, parseInt(v[`repeating_acitems_${id}_max_dex_bonus`].replace(/[^\d]/gi, "")));
							} else {
								update[`repeating_acitems_${id}_max_dex_bonus`] = "-";
							}
							spellf += parseInt(v[`repeating_acitems_${id}_spell_failure`]) || 0;
						}
						if (resdef) {
							update[`repeating_acitems_${id}_armor_speed_reduced`] = "0";
							update[`repeating_acitems_${id}_run_factor_reduced`] = "0";
						}
						if (["light", "heavy","medium"].includes(v[`repeating_acitems_${id}_type`])) { // is armor
							if (["heavy","medium"].includes(v[`repeating_acitems_${id}_type`])) { // is not light
								if (resdef) {
									update[`repeating_acitems_${id}_armor_speed_reduced`] = "1";
									spd_eqp = speedreduced;
								}
								if (v[`repeating_acitems_${id}_type`] == "heavy") { // is heavy
									if (resdef) {
										update[`repeating_acitems_${id}_run_factor_reduced`] = "1";
										run_eqp = runreduced;
									}
								}
							}
							if (!resdef) {
								spd_eqp = v[`repeating_acitems_${id}_armor_speed_reduced`] == "1" ? speedreduced : speedbase;
								run_eqp = v[`repeating_acitems_${id}_run_factor_reduced`] == "1" ? runreduced : runbase;
							}
							if (eqp) {
								speed = Math.min(speed, spd_eqp); // set equipped armor speed
								run = Math.min(run, run_eqp); // set equipped armor run speed
							}
							let unit = v.speed_unit + "-l" + (spd_eqp >= 2 ? "p" : "s");
							update[`repeating_acitems_${id}_armor_speed_max`] = spd_eqp; // update speed
							update[`repeating_acitems_${id}_run_factor`] = "×" + run_eqp; // update run factor
							update[`repeating_acitems_${id}_speed_unit_long`] = unit; // update speed unit (anytime)
						}
					});
					spellf = Math.min(spellf, 95); // NEW : set minimum to spellfailure
					if (maxdex < 99) {maxab = maxdex;}
					_.extend(update, {
						"ac_armor": bonusarmor,
						"ac_shield": bonusshield,
						"ac_flatfooted_items": bonusff,
						"ac_touch_items": bonustouch,
						"ac_natural_items": bonusnatural,
						"ac_deflection_items": bonusdeflection,
						"ac_dodge_items": bonusdodge,
						"ac_ability_maximum": maxab,
						"armor_check_penalty": checkpen,
						"armor_spell_failure": spellf,
						"speed_armor": speed,
						"armor_run_factor": run
					});
					setAttrs(update, {silent: true}, () => {
						update_ac_ability("ac_ability_maximum"); // ac & cmd
						if (((parseInt(v.speed_armor) || 0) != speed) || ((parseInt(v.armor_run_factor) || 0) != run)) {
							update_speed();
						}
						if ((parseInt(v.armor_check_penalty) || 0) != checkpen) {
							update_all_skills();
						}
						if (((v.caster1_flag == "1")
							|| (v.caster2_flag == "1"))
							&& ((parseInt(v.armor_spell_failure) || 0) != spellf)) update_all_spells("all");
					});
				});
			});
		};
		const update_ac_ability = function(attr) {
			getAttrs(pfoglobals_ac_ability_fields, (v) => {
				if (v.npc != "1") {
					setAttrs(calc_ac_ability(attr,v), {silent: true}, () => {
						update_ac();
					});
				}
			});
		};
		const calc_ac_ability = function(attr,v) {
			let update = {};
			let secabmonk = (parseInt(v.ac_secab_monk) || 0);
			let primary = (parseInt(v[v.ac_ability_primary + "_mod"]) || 0);
			let secondary = (parseInt(v[v.ac_ability_secondary + "_mod"]) || 0);
			let maxmod = Math.min(parseInt(((("" + v["ac_ability_maximum"]) || "").replace(/[^\d]/gi, "99"))), parseInt(v.encumbrance_ability_maximum) || 99);
			let ffmod = 0; //Flat-footed special mod (for Monks and such)
			if (secabmonk == 1) { //If Monk rule for secondary ability applies
				if ((secondary < 0) || (maxmod != 99)) {
					secondary = 0; // only Bonus applies (not penalty) and if not encumbered by armor or load
				} else {
					ffmod = secondary;
				}
			}
			let finalmod = Math.min(primary + secondary,maxmod);
			if ((parseInt(v.ac_condition_nobonus) || 0) == 1) { // AC Bonus denied by Condition(s)
				if ( (secabmonk == 1) && (maxmod == 99) ) { // Except that PC is a monk AND PC is unarmored/unencombered, so it may retain its secondary ability mod (which is, at worse, zero)
					finalmod = secondary;
					ffmod = secondary;
				} else {
					if (finalmod > 0) {
						finalmod = 0;
					}
				}
			}
			update["ac_ability_mod"] = finalmod;
			update["ac_ff_ability_mod"] = ffmod;
			return update;
		};
		const update_ac = function() {
			getAttrs(pfoglobals_ac_fields, (v) => {
				if (v.npc != "1") {
					setAttrs(calc_ac(v),{silent: true}, () => {
						update_cmd();
					});
				}
			});
		};
		const calc_ac = function(v) {
			let update = {}, base = 10, ac = 0, actouch = 0, acff = 0, flag = 0;

			let ability = parseInt(v.ac_ability_mod) || 0;
			let size = parseInt(v.ac_size) || 0;

			let armor = Math.max((parseInt(v.ac_armor) || 0),(parseInt(v.ac_armor_bonus) || 0));
			let shield = Math.max((parseInt(v.ac_shield) || 0),(parseInt(v.ac_shield_bonus) || 0));
			let natural = Math.max((parseInt(v.ac_natural_items) || 0), (parseInt(v.ac_natural_bonus) || 0));
			let deflection = Math.max((parseInt(v.ac_deflection_items) || 0), (parseInt(v.ac_deflection_bonus) || 0));
			let dodge = (parseInt(v.ac_dodge_items) || 0) + (parseInt(v.ac_dodge_bonus) || 0);
			let touch_bonus = (parseInt(v.ac_touch_items) || 0);
			let flatfooted_bonus = (parseInt(v.ac_flatfooted_items) || 0);

			let bonus = parseInt(v.ac_bonus) || 0;
			let misc = parseInt(v.ac_misc) || 0;

			let noflatflooted = parseInt(v.ac_noflatflooted) || 0;
			let touchshield = parseInt(v.ac_touchshield) || 0;
			let secabmonk = parseInt(v.ac_secab_monk) || 0;

			let condition = parseInt(v.ac_condition) || 0;

			ac = base + bonus + ability + armor + shield + size + natural + deflection + misc + dodge + condition;
			if (noflatflooted == 1) {
				acff = ac;
			} else {
				acff = base + bonus + ( (ability < 0) ? ability : 0 ) + armor + shield + size + natural + deflection + misc + condition;
				if (secabmonk == 1) { // Monk rules to secondary ability AC modifier
					let ffmod = (parseInt(v.ac_ff_ability_mod) || 0);
					acff += (ffmod > 0) ? ffmod : 0; // If positive (bonus), applies to Flat-Footed
				}
			}
			acff += flatfooted_bonus;
			actouch = base + bonus + ability + size + deflection + misc + dodge + condition;
			if (touchshield == 1) {
				actouch += shield;
			}
			actouch += touch_bonus;

			flag = ( (bonus != 0) || ((parseInt(v.ac_armor_bonus) || 0) > (parseInt(v.ac_armor) || 0)) || ((parseInt(v.ac_shield_bonus) || 0) > (parseInt(v.ac_shield) || 0)) || ((parseInt(v.ac_natural_bonus) || 0) > (parseInt(v.ac_natural_items) || 0)) || ((parseInt(v.ac_deflection_bonus) || 0) > (parseInt(v.ac_deflection_items) || 0)) || ((parseInt(v.ac_dodge_bonus) || 0) != 0) ) ? 1 : 0;
			update["ac"] = ac;
			update["ac_touch"] = actouch;
			update["ac_flatfooted"] = acff;
			update["ac_bonus_flag"] = flag;
			// For retrocompatibilty of API or Macro purposes (not used anywhere otherwise):
			update["ac_natural"] = natural;
			update["ac_dodge"] = dodge;
			update["ac_deflection"] = deflection;

			// console.log("*** DEBUG calc_ac update:" + JSON.stringify(update,null,"  "));
			return update;
		};
		const update_cmd = function() {
			getAttrs(pfoglobals_babs_fields, (v) => {
				if (v.npc != "1") {
					setAttrs(calc_cmd(v), {silent: true});
				}
			});
		};
		const calc_cmd = function(v) {
			// console.log("*** DEBUG calc_cmd");
			let acmod = parseInt(v.ac_ability_mod) || 0;
			if ( (acmod > 0) && (v.ac_condition_nobonus == "1") ) {
				acmod = 0;
			}
			return {"cmd_mod": (10 + (parseInt(v.bab) || 0) + (parseInt(v.strength_mod) || 0) + acmod + (parseInt(v.cmb_size) || 0) + (parseInt(v.ac_dodge_bonus) || 0) + (parseInt(v.ac_dodge_items) || 0) + Math.max((parseInt(v.ac_deflection_bonus) || 0), (parseInt(v.ac_deflection_items) || 0)) + (parseInt(v.cmd_condition) || 0) + (parseInt(v.cmd_misc) || 0) + (parseInt(v.cmd_bonus) || 0))};
		};
		const update_sr = function() {
			getAttrs(["npc","sr_base","sr_bonus"], (v) => {
				setAttrs(calc_sr(v), {silent: true});
			});
		};
		const calc_sr = function(v) {
			let update = {};
			if ("npc" in v && v.npc != "1") {
				update["sr"] = (parseInt(v.sr_base) || 0) + (parseInt(v.sr_bonus) || 0);
			}
			return update;
		};

		// === SAVES
		const update_save = function(attr) {
			getAttrs(pfoglobals_save_fields, (v) => {
				if (v.npc != "1") {
					setAttrs(calc_save(attr,v));
				}
			});
		};
		const calc_save = function(attr,v) {
				// console.log("*** DEBUG calc_save attr: " + attr);
				let update = {};
				if (v[attr + "_ability_mod"] != v[v[attr + "_ability"] + "_mod"]) {
					v[attr + "_ability_mod"] = v[v[attr + "_ability"] + "_mod"];
					update[attr + "_ability_mod"] = v[attr + "_ability_mod"];
				}
				update[attr] = pfoglobals_save_attr.map((fld) => parseInt(v[attr + "_" + fld]) || 0).reduce((total, val) => total + val);
				return update;
		};

		// === BABs
		const update_babs_all = function() {
			getAttrs(pfoglobals_babs_fields, (v) => {
				if (v.npc != "1") {
					setAttrs(calc_babs_all(v), {silent: true}, () => {
						update_attacks("all");
					});
				}
			});
		};
		const update_babs = function(attr) {
			getAttrs(pfoglobals_babs_fields, (v) => {
				if (v.npc != "1") {
					setAttrs(calc_babs(attr,v),{silent: true},() => {
						update_attacks(attr);
					});
				}
			});
		};
		const calc_babs_all = function(v) {
			// babs for multi attack array
			let bab = parseInt(v.bab) || 0, babarray = [];
			let multi = bab;
			do {
				babarray.push(multi);
				multi = multi - 5;
			} while (multi > 0);
			v["bab_multi"] = babarray;
			let update = {"bab_multi": babarray};
			_.extend(update,calc_babs("cmb",v),calc_babs("melee",v),calc_babs("ranged",v),calc_cmd(v),calc_fob(v));
			return update;
		};
		const calc_babs = function(attr,v) {
			// console.log("*** DEBUG calc_babs attr: " + attr);
			let update = {}, atkarray = [], sizemod = 0, babarray;
			if (v.bab_multi) {
				babarray = JSON.parse("[" + v.bab_multi + "]");
			} else {
				babarray = [];
			}
			if (attr === "cmb") {
				sizemod = parseInt(v.cmb_size) || 0;
			}
			else {
				sizemod = parseInt(v.bab_size) || 0;
			}
			if (v[attr + "_ability_mod"] != v[v[attr + "_ability"] + "_mod"]) {
				v[attr + "_ability_mod"] = v[v[attr + "_ability"] + "_mod"];
				update[attr + "_ability_mod"] = v[attr + "_ability_mod"];
			}
			update[attr + "_mod"] = (parseInt(v.bab) || 0) + sizemod + (parseInt(v[attr + "_ability_mod"]) || 0) + (parseInt(v[attr + "_misc"]) || 0) + (parseInt(v[attr + "_bonus"]) || 0);
			if (babarray.length) {
				_.each(babarray, (babval) => {
					atkarray.push(((parseInt(babval) || 0) + sizemod + (parseInt(v[attr + "_ability_mod"]) || 0) + (parseInt(v[attr + "_misc"]) || 0) + (parseInt(v[attr + "_bonus"]) || 0)));
				});
			} else {
				atkarray.push(update[attr + "_mod"]);
			}
			update[attr + "_multi"] = atkarray;
			return update;
		};
		const calc_fob = function(v) {
			// Flurry of Blows Attack Bonus calculation
			// ["class1_name","class2_name","class3_name","class1_bab","class2_bab","class3_bab","class1_level","class2_level","class3_level"]
			let lvl = 0, bab = 0, fob = 0, multi = 0, farray = [], fobarray = [], monkclass = 0, atksperlevel = [2, 2, 2, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 7, 7, 7, 7, 7]; // number of FoB attacks per level from 1 to 20
			let i = 0;
			for (i = 1; i < 4; i++) {
				if (v[`class${i}_name`] && v[`class${i}_name`].match(/monk/i) && !monkclass) {
					lvl = (parseInt(v[`class${i}_level`]) || 1);
					monkclass = i;
				} else {
					bab += (parseInt(v[`class${i}_bab`]) || 0);
				}
			}
			if (lvl > 0) {
				fob = bab + lvl;
				multi = fob;
				do {
					farray.push(multi);
					multi = multi - 5;
				} while (multi > 0);
				_.each(farray, (f) => {
					fobarray.push(f - 2, f - 2);
				});
				fobarray = fobarray.slice(0, atksperlevel[lvl - 1]); // limit the number of attacks according to the array
			} else {
				fobarray.push(0);
			}
			return {"fob": fob, "fob_multi": fobarray};
		};

		// === WEAPONS / ATTACKS
		const update_ammo = function(flg, sid) {
			let attrs = ["atkammo", "atktype", "bab_multi"];
			get_repsec_ids(JSON.parse(JSON.stringify([{section:"attacks", attrs:attrs}])), (repsec) => {
				getAttrs(get_repsec_fields(repsec, ["npc", "character_id", "use_ammo"].concat(attrs)), (v) => {
					if ("npc" in v && v.npc == "1") {
						return; // prompt if NPC
					}
					if (flg === undefined) {
						flg = v.use_ammo; // get use ammo flag
					}
					setAttrs(do_update_ammo(repsec, v, flg, sid), {silent: true});
				});
			});
		};
		const do_update_ammo = function(repsec, v, flg, sid) {
			let update = {};
			_.each(repsec, (sec) => {
				_.each(sec.ids, (id) => {
					if (sid !== undefined && sid !== id) {
						return; // skip
					}
					let num = ["bab_max", "fob"].includes(v[`repeating_attacks_${id}_atktype`]) ? 1 : v[`bab_multi`].length;
					let val = flg == "1" && parseInt(v[`repeating_attacks_${id}_atkammo`]) > 0 ? `!setattr --charid ${v["character_id"]} --modb --silent --repeating_attacks_${id}_atkammo|-${num}` : "";
					update[`repeating_attacks_${id}_rollammo`] = val;
				});
			}); return update;
		};
		const update_attacks = function(update_id) {
			if (update_id.substring(0,1) === "-" && update_id.length === 20) {
				do_update_attack("",[{section: "attacks", ids: [update_id], attrs: pfoglobals_atk_attr}]);
			} else if (["strength","strength_oneandahalf","strength_half","dexterity","dexterity_half","dexterity_oneandahalf","constitution","intelligence","wisdom","charisma","melee","ranged","cmb","bab","bab_max","all"].includes(update_id)) {
				get_repsec_ids(JSON.parse(JSON.stringify(pfoglobals_repsec_atk)), (repsec_agr) => {
					do_update_attack(update_id,repsec_agr);
				});
			}
		};
		const do_update_attack = function(attributename = "", repsec_agr) {
			// console.log("*** DEBUG do_update_attack: " + " / " + attributename + " / " + JSON.stringify(repsec_agr,null,"  "));
			let attack_attribs = get_repsec_fields(repsec_agr,pfoglobals_atk_fields);
			getAttrs(attack_attribs, (v) => {
				if ("npc" in v && v.npc != "1") {
					setAttrs(calc_attacks(repsec_agr, v, attributename), {silent: true});
				}
			});
		};
		const calc_attacks = function(repsec_agr, v, attributename = "") {
			// console.log("*** DEBUG calc_attacks call");
			let update = {};
			_.each(repsec_agr, (current_section) => {
				// console.log("*** DEBUG calc_attacks section: " + current_section.section);
				_.each(current_section.ids, (attackid) => {
					// console.log("*** DEBUG calc_attacks ids: " + attackid);
					if ((attributename.length === 0) || (attributename == "all")
							|| ((v[`repeating_attacks_${attackid}_atktype`] && v[`repeating_attacks_${attackid}_atktype`].includes(attributename))
							|| (v[`repeating_attacks_${attackid}_atktype2`] && v[`repeating_attacks_${attackid}_atktype2`].includes(attributename))
							|| (v[`repeating_attacks_${attackid}_dmgattr`] && v[`repeating_attacks_${attackid}_dmgattr`].includes(attributename))
							|| (v[`repeating_attacks_${+ attackid}_dmg2attr`] && v[`repeating_attacks_${attackid}_dmg2attr`].includes(attributename)))) {
						let i, stemp = "";
						let atkbonusarray = [], atkdisplay = "", atkdmgbonus = 0, atkdmg2bonus = 0;
						let atktypearray = [], atkrange = "";
						let rollatkarray = [], rollbase = "", rolldmg = "", rolldmgonly = "", rolltype = "", rollnotes = "";
						let conditions = "", condatknotes = "", conddmgnotes = "";
						let atkname = v[`repeating_attacks_${attackid}_atkname`] || "???";
						let atkflag = v[`repeating_attacks_${attackid}_atkflag`] || " {{attack=1}}";
						let atktype2 = parseInt(v[`${v["repeating_attacks_" + attackid + "_atktype2"]}_mod`]) || 0;
						let atkmod = (v[`repeating_attacks_${attackid}_atkmod`] || "0");
						let atkvs = (v[`repeating_attacks_${attackid}_atkvs`] || "ac");
						let atkcritrange = (parseInt(v[`repeating_attacks_${attackid}_atkcritrange`]) || 20);
						let dmgflag = (v[`repeating_attacks_${attackid}_dmgflag`] || " {{damage=1}} {{dmg1flag=1}}");
						let dmgbase = (v[`repeating_attacks_${attackid}_dmgbase`] || "0");
						let dmgattr = (parseInt(v[v[`repeating_attacks_${attackid}_dmgattr`] || "strength_mod"]) || 0);
						let dmgmod = (v[`repeating_attacks_${attackid}_dmgmod`] || "0");
						let dmgbonusdice = (v[`repeating_attacks_${attackid}_dmgbonusdice`] || "");
						let dmgcritmulti = (parseInt(v[`repeating_attacks_${attackid}_dmgcritmulti`]) || 2);
						let dmgtype = (v[`repeating_attacks_${attackid}_dmgtype`] || "");
						let dmg2flag = (v[`repeating_attacks_${attackid}_dmg2flag`] || "0");
						let dmg2name = (v[`repeating_attacks_${attackid}_dmg2name`] || getTranslationByKey("damage2"));
						let dmg2base = (v[`repeating_attacks_${attackid}_dmg2base`] || "0");
						let dmg2attr = (parseInt(v[`${v["repeating_attacks_" + attackid + "_dmg2attr"]}_mod`]) || 0);
						let dmg2mod = (v[`repeating_attacks_${attackid}_dmg2mod`] || "0");
						let dmg2bonusdice = (v[`repeating_attacks_${attackid}_dmg2bonusdice`] || "");
						let dmg2critmulti = (parseInt(v[`repeating_attacks_${attackid}_dmg2critmulti`]) || 1);
						let dmg2type = (v[`repeating_attacks_${attackid}_dmg2type`] || "");
						let descflag = (v[`repeating_attacks_${attackid}_descflag`] || "0");
						let atkdesc = (v[`repeating_attacks_${attackid}_atkdesc`] || "");
						let atknotes = (v[`repeating_attacks_${attackid}_notes`] || "");
						let atktmpbonus = (parseInt(v["attack_bonus"]) || 0);
						let dmgtmpbonus = (parseInt(v["damage_bonus"]) || 0);
						let multi = "";
						// Base atk & Multi attack base handling
						if (["bab","melee","ranged","cmb","fob"].includes(v[`repeating_attacks_${attackid}_atktype`])
							&& v[`${v["repeating_attacks_" + attackid + "_atktype"]}_multi`]) {
							multi = v[`${v["repeating_attacks_" + attackid + "_atktype"]}_multi`];
						} else {
							if (v[`repeating_attacks_${attackid}_atktype`] == "bab_max") {
								multi = parseInt(v.bab) || 0;
							} else {
								multi = parseInt(v[`${v["repeating_attacks_" + attackid + "_atktype"]}_mod`]) || 0;
							}
						}
						atktypearray = JSON.parse(`[${multi}]`);
						_.each(atktypearray, (atkvalue) => {
							atkbonusarray.push((parseInt(atkvalue) || 0) + atktype2 + parse_formula(atkmod,v) + atktmpbonus);
						});
						// Temp damage handling
						if ((v[`repeating_attacks_${attackid}_atktype`] == "ranged") || ((v[`repeating_attacks_${attackid}_atkrange`] || "").trim().length)) { // ranged
							dmgtmpbonus += (parseInt(v["ranged_damage_bonus"]) || 0);
						} else { // other (melee)
							dmgtmpbonus += (parseInt(v["melee_damage_bonus"]) || 0);
						}
						atkdmgbonus = dmgattr + parse_formula(dmgmod,v) + dmgtmpbonus;
						atkdmg2bonus = dmg2attr + parse_formula(dmg2mod,v) + dmgtmpbonus;
						// Display handling
						if (atkflag != "0") {
							atkdisplay = "";
							if (v[`repeating_attacks_${attackid}_atktype`] != "0") {
								if (v[`repeating_attacks_${attackid}_atktype`] == "bab_max") {
									atkdisplay += pfoglobals_i18n_obj["bab"];
								} else {
									atkdisplay += pfoglobals_i18n_obj[v[`repeating_attacks_${attackid}_atktype`]];
								}
							}
							if (v[`repeating_attacks_${attackid}_atktype2`] && v[`repeating_attacks_${attackid}_atktype2`] != "0") {
								atkdisplay += (atkdisplay.trim().length ? "+" : "") + pfoglobals_i18n_obj[v[`repeating_attacks_${attackid}_atktype2`]];
							}
							atkdisplay = `(${atkdisplay} ${pfoglobals_i18n_obj["vs"]} ${pfoglobals_i18n_obj[atkvs]})`;
							update[`repeating_attacks_${attackid}_atkdisplay`] = atkdisplay;
							for (i = 0; i < 7; i++) {
								if (i in atkbonusarray) {
									update[`repeating_attacks_${attackid}_atkbonusdisplay${i > 0 ? i : ""}`] = `${i > 0 ? "/" : ""}${atkbonusarray[i] < 0 ? "" : "+"}${atkbonusarray[i]}`;
								} else {
									update[`repeating_attacks_${attackid}_atkbonusdisplay${i > 0 ? i : ""}`] = (i > 0 ? " " : "-");
								}
							}
						} else {
							update[`repeating_attacks_${attackid}_atkdisplay`] = " ";
							for (i = 0; i < 7; i++) {
								update[`repeating_attacks_${attackid}_atkbonusdisplay${i > 0 ? i : ""}`] = (i > 0 ? " " : "-");
							}
						}
						if (dmgflag != "0") {
							update[`repeating_attacks_${attackid}_atkdmgdisplay`] = `${dmgbase}${atkdmgbonus < 0 ? "" : "+"}${atkdmgbonus}`;
							if (dmgbonusdice) {
								update[`repeating_attacks_${attackid}_atkdmgdisplay`] += `+(${dmgbonusdice})`;
							}
						} else {
							update[`repeating_attacks_${attackid}_atkdmgdisplay`] = "-";
						}
						if (dmg2flag != "0") {
							update[`repeating_attacks_${attackid}_atkdmgdisplay2`] = `${dmg2base}${atkdmg2bonus < 0 ? "" : "+"}${atkdmg2bonus}`;
							if (dmg2bonusdice) {
								update[`repeating_attacks_${attackid}_atkdmgdisplay2`] += `+(${dmg2bonusdice})`;
							}
						} else {
							update[`repeating_attacks_${attackid}_atkdmgdisplay2`] = "-";
						}

						// == Rolls handling
						if (descflag != "0") { // desc
							atkdesc = `{{descflag=[[1]]}} {{desc=${atkdesc}}}`;
						}
						if (v[`rollnotes_attack`] != "0") { // notes
							rollnotes = ` {{shownotes=[[1]]}} {{notes=${atknotes}}}`;
						}
						if (v[`repeating_attacks_${attackid}_atkrange`]) { // range
							atkrange = `{{range=${v["repeating_attacks_" + attackid + "_atkrange"]}}}`;
						}
						// Roll attack
						if (atkflag != "0") {
							rolltype += "attack";
							rollbase += `${atkflag}${atkrange}`;
							for (i = 0; i < 7; i++) {
								if (i in atktypearray) {
									stemp = atktypearray[i] + " [" + pfoglobals_i18n_obj[v[`repeating_attacks_${attackid}_atktype`]] + "] + " + atktype2 + " [" + pfoglobals_i18n_obj[(v[`repeating_attacks_${attackid}_atktype2`] || "0") == "0" ? "ability" : v[`repeating_attacks_${attackid}_atktype2`]] + "] + " + atkmod + " [Mod] + " + atktmpbonus + " [Temp] + (@{attack_condition}) [Condition] + @{rollmod_attack} [Query]";
									stemp = ` {{roll${i > 0 ? i : ""}=[[1d20cs>${atkcritrange} + ${stemp} ]]}} {{critconfirm${i > 0 ? i : ""}=[[1d20cs20 + ${stemp} + @{critconfirm_bonus} [Crit Confirm Bonus] ]]}}`;
									if (i == 0) {
										stemp += ` {{atkvs=${atkdisplay}}}`;
									}
									rollatkarray.push(stemp);
									rollbase += stemp;
								} else {
									rollatkarray.push("");
								}
							}
							// desc
							if (descflag != "0") {
								rollatkarray[0] += atkdesc;
								rollbase += atkdesc;
							}
							// notes
							if (v[`rollnotes_attack`] != "0") {
								rollatkarray[0] += rollnotes;
								rollbase += rollnotes;
							}
							// conditions
							conditions += `{{conditionsflag=[[@{attack_condition}]]}} {{conditions=@{conditions_display}}}`;
							condatknotes += v[`repeating_attacks_${attackid}_atktype`] == "cmb" ? "@{cmb_condition_note}" : "@{attack_condition_note}";
						}

						// roll damage
						if ( (dmgflag != "0") || (dmg2flag != "0") ) {
							rolltype += "damage";
							let dmgrollbase = "";
							let dmgrollcrit = "";
							let dmg2rollbase = "";
							let dmg2rollcrit = "";
							// First damage roll
							if (dmgflag != "0") {
								// Standard Damage Roll
								dmgrollbase = `${dmgbase}+${dmgattr} [${pfoglobals_i18n_obj[(v["repeating_attacks_" + attackid + "_dmgattr"] || "0") == "0" ? "ability" : v["repeating_attacks_" + attackid + "_dmgattr"]]}] + ${dmgmod} [Mod] + ${dmgtmpbonus} [Temp] + @{rollmod_damage} [Query]`;
								if (dmgbonusdice) {
									dmgrollbase += ` + ${dmgbonusdice} [Bonus dice]`;
								}
								// Critical damage Roll
								if (dmgcritmulti > 1) {
									for (i = 1; i <= dmgcritmulti; i++) {
										dmgrollcrit += `${dmgrollcrit.length ? "+" : ""}${dmgbase}`;
									}
									dmgrollcrit = `((${dmgrollcrit}) + (${dmgattr} [${pfoglobals_i18n_obj[(v["repeating_attacks_" + attackid + "dmgattr"] || "0") == "0" ? "ability" : v["repeating_attacks_" + attackid + "_dmgattr"]]}] + ${dmgmod} [Mod] + ${dmgtmpbonus} [Temp] + @{rollmod_damage} [Query]) * ${dmgcritmulti})`;
									if (dmgbonusdice) {
										dmgrollcrit += ` + ${dmgbonusdice} [Bonus dice]`;
									}
								}
								// Roll calculation
								if ( (atkflag != "0") && (atktypearray.length > 1) ) {
									// One damage roll per attack
									for (i = 0; i < atktypearray.length; i++) {
										rolldmg += ` {{roll${i > 0 ? i : ""}dmg1=[[${dmgrollbase}]]}} {{roll${i > 0 ? i : ""}dmg1type=${dmgtype}}}`;
										if (dmgcritmulti > 1) {
											rolldmg += ` {{roll${i > 0 ? i : ""}dmg1crit=[[${dmgrollcrit}]]}}`;
										}
									}
								} else {
									rolldmg += `${dmgflag} {{dmg1=[[${dmgrollbase}]]}} {{dmg1type=${dmgtype}}}`;
									if (dmgcritmulti > 1) {
										rolldmg += ` {{dmg1crit=[[${dmgrollcrit}]]}}`;
									}
								}
								// No attack (damage only) or just one attack
								rolldmgonly += `${dmgflag} {{dmg1=[[${dmgrollbase}]]}} {{dmg1type=${dmgtype}}}`;
								if (dmgcritmulti > 1) {
									rolldmgonly += ` {{dmg1crit=[[${dmgrollcrit}]]}}`;
								}
							}
							// Second damage roll
							if (dmg2flag != "0") {
								rolldmg += ` {{dmg2name=${dmg2name}}}`;
								rolldmgonly += ` {{dmg2name=${dmg2name}}}`;
								// Standard Damage Roll
								dmg2rollbase = `${dmg2base} + ${dmg2attr} [${pfoglobals_i18n_obj[(v["repeating_attacks_" + attackid + "_dmg2attr"] || "0") == "0" ? "ability" : v["repeating_attacks_" + attackid + "_dmg2attr"]]}] + ${dmg2mod} [Mod] + ${dmgtmpbonus} [Temp] + @{rollmod_damage} [Query]`;
								if (dmg2bonusdice) {
									dmg2rollbase += `+${dmg2bonusdice} [Bonus dice]`;
								}
								// Critical damage Roll
								if (dmg2critmulti > 1) {
									for (i = 1; i <= dmg2critmulti; i++) {
										dmg2rollcrit += `${dmg2rollcrit.length ? "+" : ""}${dmg2base}`;
									}
									dmg2rollcrit = `((${dmg2rollcrit}) + (${dmg2attr} [${pfoglobals_i18n_obj[(v["repeating_attacks_" + attackid + "_dmg2attr"] || "0") == "0" ? "ability" : v["repeating_attacks_" + attackid + "_dmg2attr"]]}] + ${dmg2mod} [Mod] + ${dmgtmpbonus} [Temp] + @{rollmod_damage} [Query]) * ${dmg2critmulti})`;
									if (dmg2bonusdice) {
										dmg2rollcrit += ` + ${dmg2bonusdice} [Bonus dice]`;
									}
								} else {
									dmg2rollcrit = "";
								}
								// Roll calculation
								if ( (atkflag != "0") && (atktypearray.length > 1) ) {
									// One damage roll per attack
									for (i = 0; i < atktypearray.length; i++) {
										rolldmg += ` {{roll${i > 0 ? i : ""}dmg2=[[${dmg2rollbase}]]}} {{roll${i > 0 ? i : ""}dmg2type=${dmg2type}}}`;
										if (dmg2critmulti > 1) {
											rolldmg += ` {{roll${i > 0 ? i : ""}dmg2crit=[[${dmg2rollcrit}]]}}`;
										}
									}
								} else {
									rolldmg += ` ${dmg2flag} {{dmg2=[[${dmg2rollbase}]]}} {{dmg2type=${dmg2type}}}`;
									if (dmg2critmulti > 1) {
										rolldmg += ` {{dmg2crit=[[${dmg2rollcrit}]]}}`;
									}
								}
								// No attack (damage only) or just one attack
								rolldmgonly += `${dmg2flag} {{dmg2=[[${dmg2rollbase}]]}} {{dmg2type=${dmg2type}}}`;
								if (dmg2critmulti > 1) {
									rolldmgonly += ` {{dmg2crit=[[${dmg2rollcrit}]]}}`;
								}
							}
							// desc
							if ((descflag != "0") && (atkflag == "0")) {
								rolldmg += atkdesc;
								rolldmgonly += atkdesc;
							}
							// notes
							if ((v[`rollnotes_attack`] != "0") && (atkflag == "0")) {
								rolldmg += rollnotes;
								rolldmgonly += rollnotes;
							}
							rollbase += rolldmg;
							conddmgnotes += "@{damage_condition_note}"; // conditions
						}

						// Extra attacks
						let j = 0, stempatk = "", stempdmgbase = "", stempdmg = "", stempdmgcrit = "";
						for (i = 1; i < 4; i++) {
							j = i + 6;
							if (v[`repeating_attacks_${attackid}_atkextra${i}flag`] && v[`repeating_attacks_${attackid}_atkextra${i}flag`] == "1") {
								// Attack
								stemp = ` {{roll${j}name=${v["repeating_attacks_" + attackid + "_atkextra" + i + "name"] || "Extra #1"}}}`;
								stemp += ` {{roll${j}=[[1d20cs>${v["repeating_attacks_" + attackid + "_atkextra" + i + "critrange"] || "20"}`;
								if (v[`repeating_attacks_${attackid}_atkextra${i}type`] && v[`repeating_attacks_${attackid}_atkextra${i}type`] != "0") {
									stempatk = ` + @{${v["repeating_attacks_" + attackid + "_atkextra" + i + "type"]}} [${pfoglobals_i18n_obj[v["repeating_attacks_" + attackid + "_atkextra" + i + "type"]]}]`;
								} else {
									stempatk = ` + 0`;
								}
								if (v[`repeating_attacks_${attackid}_atkextra${i}type2`] && v[`repeating_attacks_${attackid}_atkextra${i}type2`] != "0") {
									stempatk += ` + @{${v["repeating_attacks_" + attackid + "_atkextra" + i + "type2"]}} [${pfoglobals_i18n_obj[v["repeating_attacks_" + attackid + "_atkextra" + i + "type2"]]}]`;
								}
								if (v[`repeating_attacks_${attackid}_atkextra${i}mod`] && v[`repeating_attacks_${attackid}_atkextra${i}mod`] != "0") {
									stempatk += ` + ${v["repeating_attacks_" + attackid + "_atkextra" + i + "mod"]} [Mod]`;
								} else {
									stempatk += ` + 0 [Mod]`;
								}
								stempatk += `+ ${atktmpbonus} [Temp] + (@{attack_condition}) [Condition] + @{rollmod_attack} [Query]`;
								stemp += `${stempatk}]]}}`;
								stemp += ` {{critconfirm${j}=[[1d20cs20${stempatk} + @{critconfirm_bonus} [Crit Confirm Bonus]]]}}`;
								// Damage
								stempdmgbase = (v[`repeating_attacks_${attackid}_atkextra${i}dmgbase`] || "0");
								stempdmg = "";
								if ((v[`repeating_attacks_${attackid}_atkextra${i}dmgattr`] || "") != "0") {
									stempdmg += `@{${v["repeating_attacks_" + attackid + "_atkextra" + i + "dmgattr"]}} [${pfoglobals_i18n_obj[v["repeating_attacks_" + attackid + "_atkextra" + i + "dmgattr"]]}]`;
								} else {
									stempdmg += `0 [${getTranslationByKey("ability")}]`;
								}
								if (v[`repeating_attacks_${attackid}_atkextra${i}dmgmod`]) {
									stempdmg += ` + ${v["repeating_attacks_" + attackid + "_atkextra" + i + "dmgmod"] || "0"} [Mod]`;
								} else {
									stempdmg += ` + 0 [Mod]`;
								}
								stempdmg += ` + @{damage_bonus} [Temp]`;
								if ((v[`repeating_attacks_${attackid}_atkextra${i}type`] || "melee_mod") == "ranged_mod") {
									stempdmg += ` + @{ranged_damage_bonus} [Ranged Temp]`;
								} else {
									stempdmg += ` + @{melee_damage_bonus} [Melee Temp]`;
								}
								stempdmg += ` + @{rollmod_damage} [Query]`;
								stemp += ` {{roll${j}dmg1=[[${stempdmgbase} + ${stempdmg}]]}}`;
								stempdmgcrit = "";
								if (v[`repeating_attacks_${attackid}_atkextra${i}dmgcritmulti`] && (parseInt(v[`repeating_attacks_${attackid}_atkextra${i}dmgcritmulti`] || 0) > 1) && stempdmgbase != "0") {
									let g = 0;
									for (g = 0; g < (parseInt(v[`repeating_attacks_${attackid}_atkextra${i}dmgcritmulti`]) || 2); g++) {
										stempdmgcrit += `${g > 0 ? " + " : ""}${stempdmgbase}`;
									}
									stemp += ` {{roll${j}dmg1crit=[[(${stempdmgcrit}) + ((${stempdmg}) * ${v["repeating_attacks_" + attackid + "_atkextra" + i + "dmgcritmulti"]})]]}}`;
								}
								stemp += ` {{roll${j}dmg1type=${v["repeating_attacks_" + attackid + "_atkextra" + i + "dmgtype"] || ""}}}`;
								rollbase += stemp;
								update[`repeating_attacks_${attackid}_rollbase_atk${j}`] = `@{whispertype} &{template:pc} {{smallname=${atkname}}} {{type=attack}} {{showchar=@{rollshowchar}}} {{charname=@{character_name}}} ${atkflag} ${stemp} ${conditions} {{conditionsnote=${condatknotes}}}`;
							} else {
								update[`repeating_attacks_${attackid}_rollbase_atk${j}`] = "";
							}
						}

						// Update_ammo (hook)
						if (parseInt(v[`repeating_attacks_${attackid}_atkammo`]) > 0) {
							update_ammo(undefined, attackid); // NEW
						}

						// Final rolls values
						if (rolldmg) {
							update[`repeating_attacks_${attackid}_rollbase_dmg`] = `@{whispertype} &{template:pc} {{smallname=${atkname}}} {{type=damage}} {{showchar=@{rollshowchar}}} {{charname=@{character_name}}} {{nonlethal=[[1 [Non lethal]]]}} ${rolldmgonly} {{conditionsnote=${conddmgnotes}}}`;
						} else {
							update[`repeating_attacks_${attackid}_rollbase_dmg`] = " ";
						}
						if (rollbase) {
							update[`repeating_attacks_${attackid}_rollbase`] = `@{whispertype} &{template:pc} {{name=${atkname}}} {{type=${rolltype}}} {{showchar=@{rollshowchar}}} {{charname=@{character_name}}} {{nonlethal=[[1 [Non lethal]]]}} ${rollbase} ${conditions} {{conditionsnote=${condatknotes}${conddmgnotes}}}`;
						} else {
							update[`repeating_attacks_${attackid}_rollbase`] = " ";
						}
						for (i = 0; i < 7; i++) {
							if (i in rollatkarray && rollatkarray[i]) {
								update[`repeating_attacks_${attackid}_rollbase_atk${i > 0 ? i : ""}`] = `@{whispertype} &{template:pc} {{${i > 0 ? "small" : ""}name=${atkname}}} {{type=attack}} {{showchar=@{rollshowchar}}} {{charname=@{character_name}}} {{nonlethal=[[1 [Non lethal]]]}} ${atkflag} ${rollatkarray[i]} ${conditions} {{conditionsnote=${condatknotes}}}`;
							} else {
								update[`repeating_attacks_${attackid}_rollbase_atk${i > 0 ? i : ""}`] = "";
							}
						}
					}
				});
			});
			// console.log("*** DEBUG calc_attacks update: " + JSON.stringify(update,null,"  "));
			return update;
		};
		const update_damage_bonus_flag = function() {
			getAttrs(["damage_bonus","melee_damage_bonus","ranged_damage_bonus"], (v) => {
				setAttrs(calc_damage_bonus_flag(v), {silent: true}, () => {
					update_attacks("all");
				});
			});
		};
		const calc_damage_bonus_flag = function(v) {
			let update = {};
			if ( ((parseInt(v["damage_bonus"]) || 0) + (parseInt(v["melee_damage_bonus"]) || 0) + (parseInt(v["ranged_damage_bonus"]) || 0)) > 0 ) {
				update["damage_bonus_flag"] = 1;
			} else {
				update["damage_bonus_flag"] = 0;
			}
			return update;
		};

		// === NPC ATTACKS
		const update_npc_attack = function(type,id) {
			// type = "melee" / "ranged"
			let base = "repeating_npcatk-" + type + "_" + id + "_";
			let fields = [base + "atkname",base + "atkflag",base + "atkmod",base + "multipleatk_flag",base + "atkmod2",base + "atkmod3",base + "atkmod4",base + "atkmod5",base + "atkmod6",base + "atkmod7",base + "atkmod8",base + "atkmod9",base + "atkcritrange",base + "dmgflag",base + "dmgbase",base + "dmgtype",base + "dmgcritmulti",base + "dmg2flag",base + "dmg2base",base + "dmg2type",base + "dmg2critmulti"];
			if (type == "ranged") {fields.push(base + "atkrange");}
			getAttrs(fields, (v) => {
				setAttrs(calc_npc_attack(type,id,v),{silent: true});
			});
		};
		const calc_npc_attack = function(type,id,v) {
			let base = `repeating_npcatk-${type}_${id}_`;
			let update = {}, display = "", multi = "", sdmg1 = "", sdmg2 = "", scrit1 = "", scrit2 = "";
			display = v[`${base}atkname`];
			display += ` ${(parseInt(v[base + "atkmod"]) || 0) > 0 ? " + " : ""}${v[base + "atkmod"]}`;
			let dmgcritmulti = parseInt(v[`${base}dmgcritmulti`]) || 2;
			let dmg2critmulti = parseInt(v[`${base}dmg2critmulti`]) || 1;
			// First attack
			multi = ` {{roll=[[1d20cs>@{atkcritrange}+@{atkmod} [Mod]+@{rollmod_attack} [Query]]]}} {{critconfirm=[[1d20cs20+@{atkmod} [Mod]+@{rollmod_attack} [Query]]]}}`;
			// Damage
			if (v[`${base}dmgflag`] && v[`${base}dmgbase`]){
				if ( (v[`${base}dmgflag`] != "0") && (v[`${base}dmgbase`].length > 0) ){
					sdmg1 = `[[${v[base + "dmgbase"]} + @{rollmod_damage} [Query]]]`;
					multi += ` {{rolldmg1=${sdmg1}}} {{rolldmg1type=@{dmgtype}}}`;
					if (dmgcritmulti > 1) {
						scrit1 = "";
						for (i = 1; i <= dmgcritmulti; i++) {
							scrit1 += `${scrit1.length > 0 ? " + " : ""}${v[base + "dmgbase"]}`;
						}
						scrit1 = `[[(${scrit1}) + (@{rollmod_damage} [Query]*${dmgcritmulti})]]`;
						multi += ` {{rolldmg1crit=${scrit1}}}`;
					}
				}
			}
			if (v[`${base}dmg2flag`] && v[`${base}dmg2base`]){
				if ( (v[`${base}dmg2flag`] != "0") && (v[`${base}dmg2base`].length > 0) ){
					sdmg2 = `[[${v[base + "dmg2base"]} + @{rollmod_damage} [Query]]]`;
					multi += ` {{rolldmg2=${sdmg2}}} {{rolldmg2type=@{dmg2type}}}`;
					if (dmg2critmulti > 1) {
						scrit2 = "";
						for (i = 1; i <= dmg2critmulti; i++) {
							scrit2 += `${scrit2.length > 0 ? " + " : ""}${v[base + "dmg2base"]}`;
						}
						scrit2 = `[[(${scrit2}) + (@{rollmod_damage} [Query] * ${dmg2critmulti})]]`;
						multi += ` {{rolldmg2crit=${scrit2}}}`;
					}
				}
			}
			// Multi attack
			if ((v[`${base}multipleatk_flag`] || "0") == "1"){
				for (var i = 2; i < 10; i++) {
					if (v[`${base}atkmod${i}`]) {
						display += "/" + (parseInt(v[base + "atkmod" + i]) || 0) > 0 ? "+" : "" + v[base + "atkmod" + i];
						multi += ` {{roll${i-1}=[[1d20cs>@{atkcritrange} + @{atkmod${i}} [Mod] + @{rollmod_attack} [Query]]]}} {{critconfirm${i-1}=[[1d20cs20 + @{atkmod${i}} [Mod] + @{rollmod_attack} [Query]]]}}`;
						if (sdmg1.length) {
							multi += ` {{roll${i-1}dmg1=${sdmg1}}} {{roll${i-1}dmg1type=${v[base + "dmgtype"]}}}`;
							if (dmgcritmulti > 1) {
								multi += ` {{roll${i-1}dmg1crit=${scrit1}}}`;
							}
						}
						if (v[`${base}dmg2flag`] == "1") {
							multi += ` {{roll${i-1}dmg2=${sdmg2}}} {{roll${i-1}dmg2type=${v[base + "dmg2type"]}}}`;
							if (dmg2critmulti > 1) {
								multi += ` {{roll${i-1}dmg2crit=${scrit2}}}`;
							}
						}
					}
				}
			}
			if ((type == "ranged") && (v[`${base}atkrange`] || "").length) {
				display += ` ${v[base + "atkrange"]}`;
			}
			if (((v[`${base}dmgflag`] || "0") != "0") || ((v[`${base}dmg2flag`] || "0") != "0")) {
				let dmg = "";
				let dmg1 = "";
				let dmg2 = "";
				if ((v[`${base}dmgflag`] || "0") != "0") {
					dmg1 += v[`${base}dmgbase`];
					if ((parseInt(v[`${base}atkcritrange`]) || 20) < 20) {
						dmg1 += `/${v[base + "atkcritrange"]}-20`;
					}
					if ((parseInt(v[`${base}dmgcritmulti`]) || 2) != 2) {
						dmg1 += `/x${v[base + "dmgcritmulti"]}`;
					}
					if (v[`${base}dmgtype`] != "") {
						dmg1 += ` ${v[base + "dmgtype"]}`;
					}
				}
				if ((v[`${base}dmg2flag`] || "0") != "0") {
					if (v[`${base}dmg2base`].trim() != "0") {
						dmg2 += v[`${base}dmg2base`];
					}
					if (v[`${base}dmg2type`] != "") {
						dmg2 += ` ${v[base + "dmg2type"]}`;
					}
					if ((parseInt(v[`${base}dmg2critmulti`]) || 1) != 1) {
						dmg2 += `/x${v[base + "dmg2critmulti"]}`;
					}
				}
				dmg = `${dmg1}${dmg2.length >0 ? ", " : ""}${dmg2}`;
				if (dmg.length >0) {
					display += ` (${dmg})`;
				}
			}
			update[`${base}atkdisplay`] = display;
			update[`${base}multipleatk`] = multi;
			return update;
		};

		// === FEATS & TRAITS
		const update_traits = function(update_id) {
			if (update_id.substring(0,1) === "-" && update_id.length === 20) {
				do_update_traits([{section: "abilities", ids: [update_id], attrs: pfoglobals_abilities_attr}]);
			} else if (update_id == "all") {
				get_repsec_ids(JSON.parse(JSON.stringify(pfoglobals_repsec_traits)), (repsec_agr) => {
					do_update_traits(repsec_agr);
				});
			}
		};
		const do_update_traits = function(repsec_agr) {
			let attribs = get_repsec_fields(repsec_agr);
			attribs = attribs.concat(["level"],pfoglobals_abilities,pfoglobals_mods, pfoglobals_babs_fields); // For mods with levels, bab etc.
			getAttrs(attribs, (v) => {
				if ("npc" in v && v.npc != "1") {
					setAttrs(calc_traits(repsec_agr, v), {silent: true});
				}
			});
		};
		const calc_traits = function(repsec_agr, v) {
			let update = {};
			_.each(repsec_agr, (current_section) => {
				_.each(current_section.ids, (id) => {
					let perday = 0;
					if ((`repeating_abilities_${id}_perday_qty` in v) && (v[`repeating_abilities_${id}_perday_qty`].toString().trim().length)) {
						perday = parse_formula("" + v[`repeating_abilities_${id}_perday_qty`],v);
					}
					update[`repeating_abilities_${id}_perday_max`] = perday > 0 ? perday : "";
				});
			});
			return update;
		};

		// === SKILLS
		const update_all_skills = function(update_ranks = false) { // NOTE : function used only for check penalty due to armor or encumbrance
			// console.log("*** DEBUG update_all_skills call");
			get_repsec_ids(JSON.parse(JSON.stringify(pfoglobals_repsec_skills)), (repsec_agr) => {
				let fixskill_fields = pfoglobals_skill_fields;
				_.each(pfoglobals_skill_list,(skillname) => {
					fixskill_fields.push(...pfoglobals_skill_attr.map((skillattr) => `${skillname}_${skillattr}`));
					if (skillname == "fly" || skillname == "stealth") {
						fixskill_fields.push(skillname + "_size"); // NEW
					}
				});
				let fields = get_repsec_fields(repsec_agr,fixskill_fields);
				getAttrs(fields, (v) => {
					// Listing all skills to update
					let skills_array = [];
					_.each(repsec_agr, (repsec) => {
						skills_array.push(...repsec.ids.map((id) => `repeating_${repsec.section}_${id}`));
					});
					skills_array.push(...pfoglobals_skill_list);
					// console.log("*** DEBUG update_all_skills skills:" + skills_array);
					// Recalculating and updating skill_check_penalty
					v.skill_check_penalty = (parseInt(v.armor_check_penalty) || 0) + (parseInt(v.encumbrance_check_penalty) || 0); // EDIT
					// Calculating global update
					let update = calc_skill(skills_array, v, update_ranks); // EDIT
					update["skill_check_penalty"] = v.skill_check_penalty;
					// Updating
					setAttrs(update,{silent: true});
				});
			});
		};
		const update_skill = function(skillname, sourcefield) {
			let fields = pfoglobals_skill_fields.concat([...pfoglobals_skill_attr.map((skillattr) => `${skillname}_${skillattr}`)]);
			if (skillname == "fly" || skillname == "stealth") {
				fields.push(skillname + "_size"); // NEW
			}
			// console.log("*** DEBUG update_skill: skillname = " + skillname + " / sourcefield = " + sourcefield);
			getAttrs(fields, (v) => {
				setAttrs(calc_skill([skillname],v), {silent: true}, () => {
					if (sourcefield.slice(-5) == "ranks") {
						update_skills_ranks();
					}
				});
			});
		};
		const calc_skill = function(skills_array, v, update_ranks = false, check_class_skill = false) {
			let update = {};
			let total_ranks = 0;
			_.each(skills_array, (skillname) => {
				let penlt = abltmod = clsbonus = sizemod = 0; // EDIT
				let cls = parseInt(v[`${skillname}_classkill`]) || 0;
				let ranks = parseInt(v[`${skillname}_ranks`]) || 0;
				let penlt_val = v.skill_check_value;
				total_ranks += ranks;
				if (["strength","dexterity"].includes(v[`${skillname}_ability`])) {
					if (v[`${skillname}_armor_penalty`] != "0") {
						penlt = parseInt(v.skill_check_penalty) || 0;
						// v1.12 forced update
						update[`${skillname}_armor_penalty`] = "1";
					}
				} else {
					update[`${skillname}_armor_penalty`] = "0";
				}
				update[`${skillname}_check_penalty_value`] = penlt; // NEW
				if (cls * ranks != 0) {
					clsbonus = 3;
				}
				update[`${skillname}_class_skill_bonus`] = clsbonus; // NEW
				let flag = (penlt != 0 ? 1 : 0) + (((parseInt(v[`${skillname}_bonus`]) || 0) != 0 ? 1 : 0) * 2);
				update[`${skillname}_penalty_flag`] = flag;
				abltmod = parseInt(v[v[`${skillname}_ability`] + "_mod"]) || 0;
				update[`${skillname}_ability_mod`] = abltmod;
				if (skillname == "fly" || skillname == "stealth") {
					sizemod = parseInt(v[`${skillname}_size`]); // NEW
				}
				let basemod = abltmod + clsbonus + penlt + sizemod; // NEW
				let skill = basemod + ranks + (parseInt(v[`${skillname}_misc`]) || 0) + (parseInt(v[`${skillname}_bonus`]) || 0); // EDIT
				update[`${skillname}_base_mod`] = basemod; // NEW
				if (skillname.substr(0, 15) == "repeating_skill") {
					update[`${skillname}_skill`] = skill;
				}
				else {
					update[skillname] = skill;
				}
				if (check_class_skill) { // only on recalculate
					if (v[`${skillname}_classkill_flag`] !== v[`${skillname}_classkill`]) {
						console.log("Update class list flag for " + skillname); // DEBUG
						update[`${skillname}_classkill_flag`] = v[`${skillname}_classkill`];
					}
				}
			});
			if (update_ranks) {
				update["skills_ranks_total"] = total_ranks;
			}
			return update;
		};
		const update_skills_ranks = function() {
			get_repsec_ids(JSON.parse(JSON.stringify(pfoglobals_repsec_skills)), (repsec_agr) => {
				let fields = get_repsec_fields(repsec_agr,[...pfoglobals_skill_list.map((skill) => `${skill}_ranks`)])
					.filter(fld => fld.slice(-5) == "ranks");
				getAttrs(fields, (v) => {
					let ranks = 0;
					_.each(fields, (fld) => {
						ranks += parseInt(v[fld]) || 0;
					});
					setAttrs({"skills_ranks_total":ranks},{silent: true});
				});
			});
		};
		const update_skillranks_total = function() {
			getAttrs(pfoglobals_skillranks_fields, (v) => {
				setAttrs(calc_skillranks_total(v), {silent: true});
			});
		};
		const calc_skillranks_total = function(v) {
			let update = {};
			for (var i = 1; i < 4; i++) {
				update[`class${i}_skillranks_perlevel`] = Math.max((parseInt(v[`class${i}_skillranks_base`]) || 0) + (parseInt(v["intelligence_mod"]) || 0),1);
				update[`class${i}_skillranks`] = ((parseInt(update[`class${i}_skillranks_perlevel`]) || 0) * (parseInt(v[`class${i}_level`]) || 0)) + (parseInt(v[`class${i}_skillranks_misc`]) || 0);
				update["skills_ranks_total_max"] = (parseInt(update["skills_ranks_total_max"]) || 0) + update[`class${i}_skillranks`];
			}
			return update;
		};

		// === SPEED
		const rnd_sq = function(n) { // converts a number to an integer multiple of 1 // NEW
			return Math.max(1, Math.floor(n));
		};
		const rnd_ft = function(n) { // converts a number to an integer multiple of 5 // NEW
			return Math.max(5, Math.floor(n / 5) * 5);
		};
		const rnd_m = function(n) { // converts a number to a float multiple of 1.5 // NEW
			return Math.max(1.5, Math.floor(n / 1.5) * 1.5);
		};
		const get_min_speed = function(u) { //u = speed unit // NEW
			let n = 1;
			if (u == "ft") {
				n = 5;
			} else if (u == "m") {
				n = 1.5;
			}
			return n;
		};
		const calc_round_speed = function(s, u, b) { // s = speed, u = unit, b = reduced speed flag // EDIT
			let n = (parseFloat(s) || 0);
			if (u == "ft") {
				n = rnd_ft(n);
			} else if (u == "m") {
				n = rnd_m(n);
			} else {
				n = rnd_sq(n);
			}
			if (b && n > 2 * get_min_speed(u)) { // is reduced and value is greater than two times the minimum
				let t = 0;
				if (u == "ft") {
					t = rnd_ft(n/3);
				} else if (u == "m") {
					t = rnd_m(n/3);
				} else {
					t = rnd_sq(n/3);
				}
				n -= t;
			} return n;
		};
		const calc_reduced_speed = function(s, u) { // s = speed, u = unit // EDIT
			return calc_round_speed(s, u, true);
		};
		const update_speed = function() {
			getAttrs(pfoglobals_speed_fields, (v) => {
				setAttrs(calc_speed(v), {silent: true});
			});
		};
		const calc_speed = function (v) {
			// console.log("*** DEBUG calc_speed call");
			let update = {};
			// Speed encumbrance
			let speed_base = (parseFloat(v.speed_race) || 30) + (parseFloat(v.speed_class) || 0); // EDIT
			update["speed_character"] = speed_base;
			let speed_encumbrance = speed_base;
			if (["medium","heavy"].includes(v.encumbrance)) {
				speed_encumbrance = calc_reduced_speed(speed_base, v.speed_unit); // EDIT
			} else if (v.encumbrance == "over") {
				speed_encumbrance = get_min_speed(v.speed_unit); // EDIT
			}
			update["speed_encumbrance"] = speed_encumbrance;
			v.speed_encumbrance = speed_encumbrance;
			// Speed base
			if (v.speed_notmodified != "1") {
				speed_base = Math.min(speed_base, parseFloat(v.speed_encumbrance) || 6, parseFloat(v.speed_armor) || 6);
			}
			update["speed_base"] = speed_base;
			v.speed_base = speed_base;
			// Run factor
			let runfac = Math.min((parseInt(v.encumbrance_run_factor) || 4),(parseInt(v.armor_run_factor) || 4));
			update["speed_run_factor"] = runfac;
			v.speed_run_factor = runfac;
			// Final speed
			let speed = 0;
			let fourth = 0;
			let run = 0;
			if (v.speed_condition_nospeed != "1") {
				speed = ((parseFloat(v.speed_base) || 30) + (parseFloat(v.speed_bonus) || 0)) * (parseFloat(v.speed_condition_multiplier) || 1.0); // EDIT
				fourth = calc_round_speed(speed / 4, v.speed_unit); // EDIT
				speed = calc_round_speed(speed, v.speed_unit); // EDIT
				run = speed * ((v.speed_condition_norun == "1") ? 0 : (parseInt(v.speed_run_factor) || 4));
			}
			update["speed"] = speed;
			update["speed_run"] = run;
			update["speed_swim_base"] = fourth;
			update["speed_swim"] = fourth + (parseFloat(v.speed_swim_misc) || 0) + (parseFloat(v.speed_swim_bonus) || 0);
			update["speed_swim_flag"] = (parseFloat(v.speed_bonus) || 0) + (parseFloat(v.speed_swim_bonus) || 0);
			update["speed_climb_base"] = fourth;
			update["speed_climb"] = fourth + (parseFloat(v.speed_climb_misc) || 0) + (parseFloat(v.speed_climb_bonus) || 0);
			update["speed_climb_flag"] = (parseFloat(v.speed_bonus) || 0) + (parseFloat(v.speed_climb_bonus) || 0);
			// console.log("*** DEBUG calc_speed update: " + JSON.stringify(update,null,"  "));
			return update;
		};
		const update_speed_unit = function(src, flg) { // src = source string, flg = force update flag // NEW
			getAttrs(["speed_unit", "speed_race"], (v) => {
				let speed_unit = v.speed_unit, n = 0;
				let old, val = speed_unit;
				let f = parseFloat(v.speed_race);
				if (src) {
					old = speed_unit;
					val = src.newValue;
				}
				if (speed_unit == val) {
					console.log("No speed unit conversion ; " + (flg ? "Force update speed unit" : "Exit")); // DEBUG
					if (!flg) {
						return; // not force update
					} else {
						n = f;
					}
				} else { // convert speed
					if (old == "sq") {
						if (val == "ft") {
							n = rnd_ft(f * 5);
						} else if (val == "m") {
							n = rnd_m(f * 1.5);
						}
					} else if (old == "ft") {
						if (val == "sq") {
							n = Math.floor(f / 5);
						} else if (val == "m") {
							n = rnd_m(f / (10/3));
						}
					} else if (old == "m") {
						if (val == "sq") {
							n = Math.floor(f / 1.5);
						} else if (val == "ft") {
							n = rnd_ft(f *(10/3));
						}
					}
				}
				update = {
					"speed_unit" : val,
					"speed_unit_short" : val,
					"speed_unit_long" : getTranslationByKey(val + "-l" + (n >= 2 ? "p" : "s")),
					"speed_race" : n
				};
				let repsec = [{section:"acitems",attrs:["speed_unit_short"]}];
				get_repsec_ids(JSON.parse(JSON.stringify(repsec)), (repsec_agr) => {
					_.each(repsec_agr, (sec) => {
						_.each(sec.ids, (id) => {
							update[`repeating_acitems_${id}_speed_unit_short`] = val;
						});
					});
				});
				setAttrs(update, {silent: true}, () => {
					update_ac_items();
					update_speed();
				});
			});
		};

		const update_weight_unit = function() { /// NEW
			// console.log("update_weight_unit"); // DEBUG
			getSectionIDs("gear", (section) => {
				let fields = ["weight_unit"];
				_.each(section, (id) => {
					fields.push(
						`repeating_gear_${id}_quantity`,
						`repeating_gear_${id}_weight`,
						`repeating_gear_${id}_weight_total`
					);
				});
				getAttrs(fields, (v) => {
					let multiplier = v.weight_unit == "lb" ? 2 : .5; // weight unit conversion
					let update = {};
					let quantity = 0;
					let weight = 0;
					_.each(section, (id) => {
						quantity = v[`repeating_gear_${id}_quantity`] != "" ? parseFloat(v[`repeating_gear_${id}_quantity`]) : 0;
						weight = v[`repeating_gear_${id}_weight`] != "" ? parseFloat(v[`repeating_gear_${id}_weight`]) : 0;
						update[`repeating_gear_${id}_weight`] = parseFloat((weight * multiplier).toFixed(2));
						update[`repeating_gear_${id}_weight_total`] = parseFloat((quantity * weight * multiplier).toFixed(2));
					});
					setAttrs(update, {silent: true}, () => {
						update_coins_weight();
						update_wealth_weight(); // NEW
						update_gear_weight_total();
					});
				});
			});
		};

		// === GEAR WEIGHT
		const update_gear_weight = function(id) {
			// console.log("*** DEBUG update_gear_weight call id: " + id);
			let fields = [`repeating_gear_${id}_weight`,`repeating_gear_${id}_quantity`];
			getAttrs(fields, (v) => {
				let update = {};
				let weight = (parseFloat(v[`repeating_gear_${id}_weight`]) || 0.0) * (parseFloat(v[`repeating_gear_${id}_quantity`]) || 0.0);
				if ((weight - parseInt(weight)) > 0) {
					weight = parseFloat(weight.toFixed(2));
				}
				update[`repeating_gear_${id}_weight_total`] = weight;
				setAttrs(update, {silent: false});
			});
		};
		const update_coins_weight = function() {
			// console.log("*** DEBUG update_coins_weight call");
			getAttrs(["weight_unit", "money_cp", "money_sp", "money_gp", "money_pp"], (v) => {
				let f = v.weight_unit == "lb" ? 50 : 100;
				let weight = ( (parseInt(v.money_cp) || 0) + (parseInt(v.money_sp) || 0) + (parseInt(v.money_gp) || 0) + (parseInt(v.money_pp) || 0) ) / f;
				if ((weight - parseInt(weight)) > 0) weight = parseFloat(weight.toFixed(2));
				setAttrs({"encumbrance_coins_weight": weight}, {silent: false});
			});
		};
		const update_wealth_weight = function() { // NEW
			// console.log("*** DEBUG update_wealth_weight call");
			getSectionIDs("repeating_wealth", (idarray) => {
				let attribs = ["weight_unit","encumbrance_wealth_flag"];
				_.each(idarray, (id) => attribs.push(
					`repeating_wealth_${id}_quantity`,
					`repeating_wealth_${id}_weight`
				));
				getAttrs(attribs, (v) => {
					let f = v.weight_unit == "lb" ? 1 : 0.5;
					let u = {};
					let weight = 0;
					_.each(idarray, (id) => {
						weight += (parseFloat(v[`repeating_wealth_${id}_quantity`]) || 0) * (parseFloat(v[`repeating_wealth_${id}_weight`]) || 0);
					});
					weight *= (parseInt(v.encumbrance_wealth_flag) || 0) * f;
					weight = weight > 0 ? parseFloat(weight.toFixed(2)) : 0.0;
					u["encumbrance_wealth_weight"] = weight;
					setAttrs(u, {silent: false});
				});
			});
		};
		const update_gear_weight_total = function() {
			// console.log("*** DEBUG update_gear_weight_total call");
			getSectionIDs("repeating_gear", (idarray) => {
				let attribs = ["encumbrance_coins_flag","encumbrance_coins_weight","encumbrance_wealth_flag","encumbrance_wealth_weight"];
				_.each(idarray, (id) => {
					attribs.push(`repeating_gear_${id}_weight_total`);
				});
				getAttrs(attribs, (v) => {
					let total = 0;
					_.each(idarray, (id) => {
						total += parseFloat(v[`repeating_gear_${id}_weight_total`]) || 0.0;
					});
					total += (parseInt(v.encumbrance_coins_flag) || 0) * (parseFloat(v.encumbrance_coins_weight) || 0);
					total += (parseInt(v.encumbrance_wealth_flag) || 0) * (parseFloat(v.encumbrance_wealth_weight) || 0);
					if ((total - parseInt(total)) > 0) {
						total = parseFloat(total.toFixed(2));
					}
					setAttrs({"encumbrance_gear_weight": total}, {silent: false});
				});
			});
		};

		// === GEAR COST AND USAGES
		const update_gear_value = function(id) { // id = repeating gear id
			getAttrs([`repeating_gear_${id}_cost`], (q) => {
				let s = q[`repeating_gear_${id}_cost`];
				let a = [];
				s = s.replace(/@{\s*([\w\d]+)\s*}/g, (match, r) => { // unique attributes
					r = r.toLowerCase();
					a.push(r);
					return `@{${r}}`;
				});
				s = s.replace(/~{\s*([\w\d]+)\s*}/g, (match, r) => { // repeated attributes
					r = "repeating_gear_" + id + "_" + r.toLowerCase();
					a.push(r);
					return `@{${r}}`;
				});
				getAttrs(a, (v) => {
					let u = {};
					u[`repeating_gear_${id}_value`] = parse_formula(s, v);
					setAttrs(u, {silent: true});
				});
			});
		}
		const switch_gear_usage = function(id) { // id = repeating gear id
			getAttrs([`repeating_gear_${id}_usage`], (q) => {
				let s = q[`repeating_gear_${id}_usage`];
				let b = e.newValue == undefined || e.newValue == "constant" || e.newValue == "at-will" ? "0" : "1";
				let u = {};
				u[`repeating_gear_${id}_show_uses`] = b;
				setAttrs(u, {silent: true});
			});
		}

		// === VALUES (GOLD PIECES)
		const get_total_values = function(id) { // id = repeating gear id
			let money_items = ["money_cp", "money_sp", "money_gp", "money_pp"]
			let a = [...money_items, "character_name"];
			getSectionIDs("repeating_wealth", (wealth_items) => {
				_.each(wealth_items, (id) => a.push(
					`repeating_wealth_${id}_quantity`,
					`repeating_wealth_${id}_value`
				));
				getSectionIDs("repeating_gear", (gear_items) => {
					_.each(gear_items, (id) => a.push(
						`repeating_gear_${id}_quantity`,
						`repeating_gear_${id}_value`
					));
					getAttrs(a, (v) => {
						let s = v["character_name"];
						let m = money_value = wealth_value = gear_value = 0;
						_.each(money_items, (id) => {
							switch (id) {
								case "money_cp": m = 0.01; break;
								case "money_sp": m = 0.1; break;
								case "money_pp": m = 10 ; break;
								default : m = 1;
							}
							money_value += (parseFloat(v[id]) || 0) * m;
						});
						_.each(wealth_items, (id) => {
							wealth_value += (parseFloat(v[`repeating_wealth_${id}_quantity`]) || 0) * (parseFloat(v[`repeating_wealth_${id}_value`]) || 0);
						});
						_.each(gear_items, (id) => {
							gear_value += (parseFloat(v[`repeating_gear_${id}_quantity`]) || 0) * (parseFloat(v[`repeating_gear_${id}_value`]) || 0);
						});
						s += ` has ${money_value + wealth_value + gear_value} values in gp`;
						s += ` (money ${money_value} gp)`;
						s += ` (wealth ${wealth_value} gp)`;
						s += ` (gear ${gear_value} gp)`;
						console.info(s);
					});
				});
			});
		};

		// === ENCUMBRANCE / OVERLOAD
		const rnd_enc = function(r) { // converts a number to a float rounded to 0.5 // NEW
			let n = parseInt(r.toString());
			let m = r - n;
			return n + (m > (2/3) ? 0.5 : 0);
		};
		const update_encumbrance = function() {
			getAttrs(pfoglobals_encumbrance_fields, (v) => {
				// console.log("*** DEBUG update_encumbrance");
				if (v.npc != "1") {
					setAttrs(calc_encumbrance(v), {silent: true}, () => {
					update_speed();
					update_ac_ability("encumbrance_ability_maximum");
					update_all_skills();
					});
				}
			});
		};
		const calc_encumbrance = function(v) {
			// console.log("*** DEBUG calc_encumbrance call");
			let update = {}, checkpen = 0, dexmax = 99, maxab = "-", display = "";
			let runfactor = parseInt(v.base_run_factor) || 4;
			let wgtfactor = v.weight_unit == "lb" ? 1 : .5; // lbs or kg
			let weight = parseInt(v.encumbrance_gear_weight) || 0;
			let speedbase = (parseFloat(v.speed_race) || 30) + (parseFloat(v.speed_class) || 0); // EDIT
			let bonus = parseInt(v.encumbrance_load_bonus) || 0;
			let str = (parseInt(v.strength) || 10) + bonus;
			let multi = parseFloat(v.encumbrance_load_multiplier) || 1.0;
			let size = parseFloat(v.encumbrance_size) || 1.0;
			let heavy = parseInt((calc_max_load(str) * size) * multi * wgtfactor);
			let medium = parseFloat(((heavy / 3) * 2).toFixed(1));
			let light = parseFloat((heavy / 3).toFixed(1));
			let prevenc = v.encumbrance; // light / medium / heavy / over
			let speed = speedbase;
			let newenc = prevenc;
			update["encumbrance_load_light"] = rnd_enc(light);
			update["encumbrance_load_medium"] = rnd_enc(medium);
			update["encumbrance_load_heavy"] = rnd_enc(heavy);
			update["encumbrance_lift_head"] = rnd_enc(heavy);
			update["encumbrance_lift_ground"] = rnd_enc(heavy * 2);
			update["encumbrance_drag_push"] = rnd_enc(heavy * 5);
			if (v.encumbrance_display) {
				display = v.encumbrance_display;
			}
			if ((weight > light) && (weight <= medium)) {
				newenc = "medium";
				checkpen = -3;
				speed = calc_reduced_speed(speedbase, v.speed_unit); // NEW
				dexmax = 3;
			} else if ((weight > medium) && (weight <= heavy)) {
				newenc = "heavy";
				checkpen = -6;
				speed = calc_reduced_speed(speedbase, v.speed_unit); // NEW
				dexmax = 1;
				runfactor = Math.max(1, runfactor - 1);
			} else if (weight > heavy) {
				newenc = "over";
				checkpen = -6;
				speed = get_min_speed(v.speed_unit); // NEW
				dexmax = 0;
				runfactor = 1; // NEW
			} else {
				newenc = "light";
			}
			if ((prevenc != newenc) || (display == "")) {
				if (dexmax < 99) {
					maxab = dexmax;
				}
				update["encumbrance"] = newenc;
				update["encumbrance_display"] = getTranslationByKey(`${newenc}-load`);
				update["encumbrance_check_penalty"] = checkpen;
				update["speed_encumbrance"] = speed;
				update["encumbrance_ability_maximum"] = maxab;
				update["encumbrance_run_factor"] = runfactor;
			}
			return update;
		};
		const calc_max_load = function(str) {
			if ((str >= 0) && (str <= 10)) { return (str * 10);}
			else if (str > 14) { return (2 * calc_max_load(str - 5));}
			else {return ([115, 130, 150, 175][str - 11]);}
		};

		// === MAGIC POINTS
		const calc_mp = function(v) { // v = repsec values // NEW
			let upd = {};
			let val = parseInt(v["mp"]) || 0;
			let temp = parseInt(v["mp_temp"]) || 0;
			let temp_last = parseInt(v["mp_temp_last"]) || 0;
			let base = parse_formula(v["mp_max_base"], v);
			let max = Math.max(0, base + temp);
			upd["mp"] = Math.max(0, val + temp - temp_last);
			upd["mp_max"] = max;
			upd["mp_max_view"] = max;
			upd["mp_temp_last"] = temp;
			setAttrs(upd, {silent: true});
		};
		const update_mp = function() { // NEW
			getAttrs(["mp", "mp_max_base", "mp_temp", "mp_temp_last"], (v) => {
				let s = v["mp_max_base"] || "";
				let b = true;
				if (s.length > 0) { // attributes in formula
					let p = new RegExp("@{([^}]+)}", "g");
					let a = s.match(p);
					if (a && a.length > 0) {
						a = a.map((m) => {return m.replace(p,(match, r) => {return r})});
						b = false;
						getAttrs(a, (w) => {calc_mp({...v, ...w})});
					}
				}
				if (b) {
					calc_mp(v); // no attributes in formula
				}
			});
		};

		// === DOMAINS AND SCHOOLS
		const get_domain_spell = function(lvl, id, v) { // lvl = spell level number, id = repeating spell id, v = repsec values // NEW
			let update = {};
			let num = v[`repeating_spell-${lvl}_${id}_spellcaster`] || "1";
			let val = v[`caster${num}_domains_schools_flag`] || "none"; // "none", ""domains", ""schools
			if (val == "none" || val == "domains") {
				update[`repeating_spell-${lvl}_${id}_spellschoolflag`] = "0";
			}
			if (val == "none" || val == "schools") {
				update[`repeating_spell-${lvl}_${id}_spelldomainflag`] = "0";
			}
			update[`repeating_spell-${lvl}_${id}_caster_domain_school_flag`] = val;
			return update;
		};
		const update_domain_school = function(lvl) { // lvl = spell level number // NEW
			getSectionIDs(`repeating_spell-${lvl}`, (ids) => {
				let attrs = ["caster1_domains_schools_flag", "caster2_domains_schools_flag"];
				_.each(ids, (id) => {attrs.push(`repeating_spell-${lvl}_${id}_spellcaster`)});
				getAttrs(attrs, (v) => {
					let update = {};
					_.each(ids, (id) => {_.extend(update, get_domain_spell(lvl, id, v))});
					setAttrs(update, {silent: true});
				});
			});
		};
		const update_all_domain_school = function(num, val) { // num = caster class number, val = "domains", "schools" or "none" // NEW
			if (num && val) { // update radio
				let update = {}, i;
				update[`caster${num}_domains_schools_flag`] = val;
				setAttrs(update, {silent: true});
			}
			for (i = 0; i < 10; i++) update_domain_school(i);
		};

		// === CONCENTRATION
		const update_concentration = function(srcattr) {
			let cster = srcattr.substr(0,7).slice(-1);
			getAttrs(pfoglobals_concentration_fields, (v) => {
				if (v.npc != "1") {
					setAttrs(calc_concentration(srcattr, v), {silent: true}, () => {
						if (srcattr == `caster${cster}_ability`) {
							update_spells_dc(srcattr);
						}
					});
				}
			});
		};
		const calc_concentration = function(srcattr, v) {
			// console.log("*** DEBUG calc_concentration srcattr: " + srcattr);
			let update = {}, cster = srcattr.substr(0,7).slice(-1);
			if (srcattr == `caster${cster}_ability`) {
				update[`caster${cster}_ability_mod`] = parseInt(v[v[`caster${cster}_ability`] + "_mod"]) || 0;
				v[`caster${cster}_ability_mod`] = update[`caster${cster}_ability_mod`];
			}
			update[`caster${cster}_concentration`] = (parseInt(v[`caster${cster}_level`]) || 0) + (parseInt(v[`caster${cster}_ability_mod`]) || 0) + (parseInt(v[`caster${cster}_concentration_misc`]) || 0) + (parseInt(v[`caster${cster}_concentration_bonus`]) || 0);
			return update;
		};

		// === SPELLS DC
		const update_spells_dc = function(attr) {
			// console.log("*** DEBUG update_spells_dc attr: " + attr);
			let minlvl = 0, maxlvl = 0, update_all = false;
			if (["caster1_ability","caster1_ability_mod","caster1_dc_misc","caster2_ability","caster2_ability_mod","caster2_dc_misc"].includes(attr)) {
				update_all = true;
				maxlvl = 10;
			} else {
				minlvl = parseInt(attr.slice(-1)) || 0;
				maxlvl = 1 + minlvl;
			}
			if ((minlvl >= 0) && (maxlvl <= 10)) {
				getAttrs(pfoglobals_spells_dc_fields, (v) => {
					if (v.npc != "1") {
						let update = calc_spells_dc(attr, v, minlvl, maxlvl);
						if (update_all) {
							setAttrs(update, {silent: true}, () => {
								update_all_spells("all");
							});
						} else {
							setAttrs(update, {silent: false});
						}
					}
				});
			}
		};
		const calc_spells_dc = function(attr, v, minlvl, maxlvl) {
			// console.log("*** DEBUG calc_spells_dc attr: " + attr);
			var cster = attr.substr(0,7).slice(-1), update = {}, i = 0;
			if (attr == `caster${cster}_ability`) {
				update[`caster${cster}_ability_mod`] = parseInt(v[v[`caster${cster}_ability`] + "_mod"]) || 0;
				v[`caster${cster}_ability_mod`] = update[`caster${cster}_ability_mod`];
			}
			for (i = minlvl; i < maxlvl; i++) {
				update[`caster${cster}_dc_level_${i}`] = 10 + i + (parseInt(v[`caster${cster}_ability_mod`]) || 0) + (parseInt(v[`caster${cster}_dc_misc`]) || 0) + (parseInt(v[`caster${cster}_dcbonus_level_${i}`]) || 0);
			}
			return update;
		};

		// === SPELLS PREPARATION
		const update_spells_flag = function(lvl) { // lvl = spell level number // EDIT
			// console.log("*** DEBUG update_spells_flag lvl: " + lvl);
			let a = [
				`caster1_spells_known_level_${lvl}`, // sp
				`caster2_spells_known_level_${lvl}`,
				`caster1_spells_total_level_${lvl}`,
				`caster2_spells_total_level_${lvl}`,
				`caster1_mp_known_level_${lvl}`, // mp
				`caster2_mp_known_level_${lvl}`,
				`caster1_mp_known_bonus_level_${lvl}`,
				`caster2_mp_known_bonus_level_${lvl}`,
				"caster1_level_ctrl", // spell levels
				"caster2_level_ctrl"
			];
			getAttrs(a, (v) => {
				let u = {}, i, t = 0;
				let n = parseInt(v[`caster1_level_ctrl`] || 0);
				let m = parseInt(v[`caster2_level_ctrl`] || 0);
				if (lvl > Math.max(n, m)) {
					u[`caster_spells_flag_level_${lvl}`] = 0;
				} else {
					for (i in a) t += parseInt(v[a[i]] || 0);
					u[`caster_spells_flag_level_${lvl}`] = (t > 0) ? 1 : 0;
				}
				setAttrs(u);
			});
		};
		const update_spells_totals = function(level,cster) {
			// console.log("*** DEBUG update_spells_totals level: " + level + ", caster: " + cster);
			getAttrs([`caster${cster}_spells_perday_level_${level}`, `caster${cster}_spells_bonus_level_${level}`], (v) => {
				let update = {};
				update[`caster${cster}_spells_total_level_${level}`] = (parseInt(v[`caster${cster}_spells_perday_level_${level}`]) || 0) + (parseInt(v[`caster${cster}_spells_bonus_level_${level}`]) || 0);
				setAttrs(update, {silent: false});
			});
		};
		const update_spells_prepared = function (src) {
			// console.log("*** DEBUG update_spells_prepared src: " + src + ");
			let update = {};
			let level = src.substr(16,1);
			getSectionIDs(`repeating_spell-${level}`, (ids) => {
				let attrs = [`caster1_spells_total_level_${level}`,`caster2_spells_total_level_${level}`];
				attrs.push(...ids.map((sid) => `repeating_spell-${level}_${sid}_spellprepared`),...ids.map((sid) => `repeating_spell-${level}_${sid}_spellcaster`));
				getAttrs(attrs, (v) => {
					let total1 = 0, total2 = 0;
					_.each(ids, (id) => {
						if (v[`repeating_spell-${level}_${id}_spellcaster`] == "2") {
							total2 += (parseInt(v[`repeating_spell-${level}_${id}_spellprepared`]) || 0);
						} else {
							total1 += (parseInt(v[`repeating_spell-${level}_${id}_spellprepared`]) || 0);
						}
					});
					update[`caster1_spells_prepared_level_${level}`] = total1;
					update[`caster1_spells_prepared_flag_${level}`] = (total1 > (parseInt(v[`caster1_spells_total_level_${level}`]) || 0)) ? 1 : 0;
					update[`caster2_spells_prepared_level_${level}`] = total2;
					update[`caster2_spells_prepared_flag_${level}`] = (total2 > (parseInt(v[`caster2_spells_total_level_${level}`]) || 0)) ? 1 : 0;
					setAttrs(update, {silent: true});
				});
			});
		};

		// === SPELLS KNOWN
		const update_spells_known = function (src, num, lvl) { // src = source attribute, num = caster class number, lvl = spell level number // NEW
			if (typeof(src) === "string") {
				num = src.substr(6,1);
				lvl = src.slice(-1);
			}
			if (num && lvl) {
				let upd = {};
				getAttrs([`caster${num}_mp_known_level_${lvl}`, `caster${num}_mp_known_bonus_level_${lvl}`], (v) => {
					upd[`caster${num}_mp_known_total_level_${lvl}`] = Math.max(0, parseInt(v[`caster${num}_mp_known_level_${lvl}`]) + parseInt(v[`caster${num}_mp_known_bonus_level_${lvl}`]));
					setAttrs(upd, {silent: true}, () => {
						update_spells_flag(lvl); // callback
					});
				});
			}
		};
		const update_all_spells_known = function () { // NEW
			let i, j;
			for (j = 1; j < 3; j++) {
				for (i = 0; i < 10; i++) {
					update_spells_known(null, j, i);
				}
			}
		};

		// === SPELLS SPEND MP
		const get_spell_spend_mp = function(lvl, id, v) {// lvl = spell level number, id = repeating spell id, v = repsec values // NEW
			let upd = {};
			let spl = `repeating_spell-${lvl}_${id}`;
			let val = v[`${spl}_spellcost`] || "0";
			let str = "";
			if (v["spellcasting_mode"] == "mp"
			 && v["spend_mp"] == "1"
			 && (v[`${spl}_spelldomainflag`] || "0") == "0") str = `!setattr --charid ${v["character_id"]} --modb --silent --mp|-${val}`;
			upd[`${spl}_rollspellmp`] = str;
			return upd;
		};
		const update_spell_spend_mp_id = function(lvl, id) { // lvl = spell level number, id = repeating spell id // NEW
			let attrs = ["character_id", "spellcasting_mode", "spend_mp"];
			attrs.push(
				`repeating_spell-${lvl}_${id}_spelldomainflag`,
				`repeating_spell-${lvl}_${id}_spellcost`
			);
			getAttrs(attrs, (v) => {
				setAttrs(get_spell_spend_mp(lvl, id, v), {silent: true});
			});
		};
		const update_spell_spend_mp = function(lvl) { // lvl = spell level number // NEW
			getSectionIDs(`repeating_spell-${lvl}`, (ids) => {
				let attrs = ["character_id", "spellcasting_mode", "spend_mp"];
				_.each(ids, (id) => {
					attrs.push(
						`repeating_spell-${lvl}_${id}_spelldomainflag`,
						`repeating_spell-${lvl}_${id}_spellcost`
					);
				});
				getAttrs(attrs, (v) => {
					let upd = {};
					_.each(ids, (id) => {
						_.extend(upd, get_spell_spend_mp(lvl, id, v));
					});
					setAttrs(upd, {silent: true});
				});
			});
		};
		const update_all_spell_spend_mp = function() { // NEW
			for (i = 0; i < 10; i++) {
				update_spell_spend_mp(i);
			}
		};

		// === SPELLS COST
		const update_spell_cost = function (lvl) { // lvl = spell level number // NEW
			getSectionIDs(`repeating_spell-${lvl}`, (ids) => {
				let attrs = [`caster1_mp_cost_level_${lvl}`, `caster2_mp_cost_level_${lvl}`, "spellcasting_mode", "spend_mp"];
				_.each(ids, (id) => {
					attrs.push(
						`repeating_spell-${lvl}_${id}_spellcaster`,
						`repeating_spell-${lvl}_${id}_spell_cost_mod`,
						`repeating_spell-${lvl}_${id}_spellschoolflag`
					);
				});
				let nbr, val, mod, spe, opp, upd = {};
				getAttrs(attrs, (v) => {
					_.each(ids, (id) => {
						nbr = v[`repeating_spell-${lvl}_${id}_spellcaster`];
						val = parseInt(v[`caster${nbr}_mp_cost_level_${lvl}`]) || 0;
						mod = parseInt(v[`repeating_spell-${lvl}_${id}_spell_cost_mod`]) || 0;
						wiz = v[`repeating_spell-${lvl}_${id}_spellschoolflag`] || 0;
						if (wiz == "speciality") {
							val -= 2;
						} else if (wiz == "opposition") {
							val += 4;
						}
						upd[`repeating_spell-${lvl}_${id}_spellcost`] = Math.max(1, val + mod);
					});
					setAttrs(upd, {silent: true}, () => {
						if (v["spellcasting_mode"] == "mp"
						 && v["spend_mp"] == "1") update_spell_spend_mp(lvl); // callback
					});
				});
			});
		};
		const update_all_spell_cost = function () { // NEW
			let i;
			for (i = 0; i < 10; i++) {
				update_spell_cost(i);
			}
		};

		// === SPELLS / SPELLCASTING
		const update_all_spells = function(update_id) {
			// Gathering all spells levels items ids to pass to update_spells()
			get_repsec_ids(JSON.parse(JSON.stringify(pfoglobals_repsec_spell)), (repsec_agr)=> {
				do_update_spell(["0","1","2","3","4","5","6","7","8","9","like"],update_id,repsec_agr);
			});
		};
		const update_spells = function(level,update_id) {
			// console.log("*** DEBUG DOING UPDATE_SPELLS: " + level + " / " + update_id);
			let attr_array = [];
			if (level == "like") {
				attr_array = pfoglobals_spell_attr.concat(pfoglobals_spell_like_attr);
			} else {
				attr_array = pfoglobals_spell_attr.concat(pfoglobals_spell_only_attr);
			}
			if (update_id.substring(0,1) === "-" && update_id.length === 20) {
				do_update_spell([level],"",[{section: `spell-${level}`, ids: [update_id], attrs: attr_array}]);
			} else if (["strength","dexterity","constitution","intelligence","wisdom","charisma","melee","ranged","cmb","all"].includes(update_id)) {
				get_repsec_ids([{section: "spell-" + level, attrs: attr_array}], (repsec_agr) => {
					do_update_spell([level],update_id,repsec_agr);
				});
			}
		};
		const do_update_spell = function(level, attributename = "", repsec_agr) {
			// console.log("*** DEBUG do_update_spell: " + level + " / " + attributename);
			let spell_attribs = get_repsec_fields(repsec_agr, pfoglobals_spell_fields);
			spell_attribs = spell_attribs.concat(["level"],pfoglobals_babs_fields,pfoglobals_abilities); // EDIT
			getAttrs(spell_attribs, (v) => {
				setAttrs(calc_spells(level, repsec_agr, v, attributename), {silent: true});
			});
		};
		const calc_spells = function(level, repsec_agr, v, attributename = "") {
			let update = {};
			_.each(level, (spell_level) => {
				let repsec = repsec_agr.find((repsec) => repsec.section === "spell-" + spell_level);
				if (repsec && repsec.ids) {
					_.each(repsec.ids, (spellid) => {
						if ( (attributename.length === 0) || (attributename == "all") || (v["repeating_spell-" + spell_level + "_" + spellid + "_spellatktype"] && v["repeating_spell-" + spell_level + "_" + spellid + "_spellatktype"].includes(attributename))) {
							_.extend(update,calc_spell(spell_level,spellid,v));
						}
					});
				}
			});
			return update;
		};
		const calc_spell = function(spell_level,spellid,v) {
			let update = {}, stemp = "", rollbase = "", rollbasetemplate = "pc", conditionsnote = "";
			// console.log("*** DEBUG calc_spell: " + spell_level + " / " + spellid);
			// Begin calc
			if ("npc" in v && v.npc == "1") {
				rollbasetemplate = "npc";
			}
			let repspl = `repeating_spell-${spell_level}_${spellid}`; // NEW
			let atkflag = (v[`${repspl}_spellatkflag`] || "0");
			let atktype = (v[`${repspl}_spellatktype`] || "0");
			let atkmod = (v[`${repspl}_spellatkmod`] || "0");
			let atkcritrange = (parseInt(v[`${repspl}_spellatkcritrange`]) || 20);
			let dmgflag = (v[`${repspl}_spelldmgflag`] || "0");
			let dmgbase = (v[`${repspl}_spelldmg`] || "0");
			if (! dmgbase.length) {
				dmgbase = "0";
			}
			let dmgcritmulti = (parseInt(v[`${repspl}_spelldmgcritmulti`]) || 1);
			let dmgtype = (v[`${repspl}_spelldmgtype`] || "");
			let dmg2flag = (v[`${repspl}_spelldmg2flag`] || "0");
			let dmg2name = (v[`${repspl}_spelldmg2name`] || getTranslationByKey("damage2"));
			let dmg2base = (v[`${repspl}_spelldmg2`] || "0");
			if (! dmg2base.length) {
				dmg2base = "0";
			}
			let dmg2type = (v[`${repspl}_spelldmg2type`] || "");
			let cster = (v[`${repspl}_spellcaster`] || "1");
			let csterflag1 = (v.caster1_flag || "0");
			let csterflag2 = (v.caster2_flag || "0");
			let splname = v[`${repspl}_spellname`];
			let perday = v[`${repspl}_timesperday`];
			let perdaymax = `${repspl}_perday_max`;
			let perdayqty = v[`${repspl}_perday_qty`];
			let splprep = `${repspl}_spellprepared`;
			let spldisp = `${repspl}_spelldisplay`;
			let spltype = v[`${repspl}_spelltype`];
			let splperm = `${repspl}_spellpermanent`;
			let splfreq = ["per-hour","per-day","per-week","per-month","per-year"];
			let domain = v[`${repspl}_spelldomainflag`] || "0";
			let wizsch = v[`${repspl}_spellschoolflag`] || "none";
			if (spell_level == "like") {
				// v1.21+: Dynamic occurences calculation for PCs
				if (spltype) {
					splname += " (" + getTranslationByKey(spltype) + ")";
				}
				update[spldisp] = splname;
				update[splprep] = 0;
				update[splperm] = "";
				if ((v.npc != "1") && perday && splfreq.includes(perday)) {
					update[perdaymax] = parse_formula("" + (perdayqty || "1"),v);
					v[perdaymax] = update[perdaymax];
				}
				if (splfreq.includes(perday)) {
					update[splprep] = 1;
				} else if (perday == "constant" || perday == "at-will") {
					update[splperm] = getTranslationByKey(perday + "-u");
				} else if (perday == "every-hours") {
					update[splperm] = pfoglobals_i18n_obj["every-hours"].replace("X",(v[perdaymax] || "1")).toLowerCase();
				}
			} else {
				update[`${repspl}_spelldisplay`] = (v[`${repspl}_spellname`] || "???");
				// Multicasting
				if ((csterflag1 == "1") && (v.caster1_class)) {
					update[`${repspl}_spellcaster1_class`] = (v.caster1_class.length > 0) ? v.caster1_class : " ";
				} else {
					update[`${repspl}_spellcaster1_class`] = " ";
				}
				if ((csterflag2 == "1") && (v.caster2_class)) {
					update[`${repspl}_spellcaster2_class`] = (v.caster2_class.length > 0) ? v.caster2_class : " ";
				} else {
					update[`${repspl}_spellcaster2_class`] = " ";
				}
				if ((csterflag1 == "1") && (csterflag2 == "1")) {
					update[`${repspl}_spellmulticasters-flag`] = 1;
				} else {
					update[`${repspl}_spellmulticasters-flag`] = 0;
					if (csterflag1 == "1") {
						update[`${repspl}_spellcaster`] = 1;
						cster = "1";
					} else if (csterflag2 == "1") {
						update[`${repspl}_spellcaster`] = 2;
						cster = "2";
					}
				}
			}
			// == Save DC ${spell_level}_${spellid}
			let savedc = 0;
			if ("npc" in v && v.npc != "1") {
				savedc += (parseInt(v[`caster${cster}_dc_level_${spell_level}`]) || 0) + parse_formula((v[`${repspl}_spelldc_mod`] || ""),v);
			} else {
				savedc += (parseInt(v[`${repspl}_spelldc_mod`]) || 0);
			}
			// == Rolls handling
			// base
			rollbase = `@{whispertype} &{template:${rollbasetemplate}} {{name=${splname}}} {{type=spell}} {{showchar=@{rollshowchar}}} {{charname=@{character_name}}} {{nonlethal=[[1 [Non lethal]]]}}`;
			// spell level
			if (spell_level == "like") {
				if ("npc" in v && v.npc == "1") {
					rollbase += ` {{level=${v.caster2_level}}}`;
				}
			} else {
				rollbase += ` {{level=${spell_level}}}`;
			}
			// caster class
			if ((v.npc || "0") != "1" && csterflag1 == "1" && csterflag2 == "1" && v.caster1_class && v.caster2_class && spell_level != "like") {
				rollbase += ` {{casterclass=${(cster == "1") ? v.caster1_class : v.caster2_class}}}`;
			}
			// domain
			if (domain != "0") {
				rollbase += ` {{domain=${v[repspl + "_spelldomain"]}}}`;
			}
			// school
			if (v[`${repspl}_spellschool`]) {
				rollbase += ` {{school=${v[repspl + "_spellschool"]}}}`;
			}
			// wizard arcane school
			if (wizsch != "0" && wizsch != "none") {
				rollbase += ` {{wizardschool=${getTranslationByKey("school-" + wizsch)}}}`;
			}
			// casting time
			if (v[`${repspl}_spellcastingtime`]) {
				rollbase += ` {{castingtime=${v[repspl + "_spellcastingtime"]}}}`;
			}
			// component
			if (spell_level != "like") {
				if (v[`${repspl}_spellcomponent`]) {
					rollbase += ` {{component=${v[repspl + "_spellcomponent"]}}}`;
				}
			}
			// range
			if (v[`${repspl}_spellrange`]) {
				rollbase += ` {{range=${v[repspl + "_spellrange"]}}}`;
			}
			// area
			if (v[`${repspl}_spellarea`]) {
				rollbase += ` {{area=${v[repspl + "_spellarea"]}}}`;
			}
			// targets
			if (v[`${repspl}_spelltargets`]) {
				rollbase += ` {{targets=${v[repspl + "_spelltargets"]}}}`;
			}
			// effect
			if (v[`${repspl}_spelleffect`]) {
				rollbase += ` {{effect=${v[repspl + "_spelleffect"]}}}`;
			}
			// duration
			if (v[`${repspl}_spellduration`]) {
				rollbase += ` {{duration=${v[repspl + "_spellduration"]}}}`;
			}
			// saving throw
			if (v[`${repspl}_spellsaveflag`] && v[`${repspl}_spellsaveflag`] != "0") {
				rollbase += ` {{save=1}} {{savedc=[[${savedc}]]}} {{saveeffect=${v[repspl + "_spellsave"] || ""}}}`;
			}
			// spell resistance
			if (v[`${repspl}_spellresistanceflag`] && v[`${repspl}_spellresistanceflag`] != "0") {
				rollbase += ` {{sr=1}} {{spellresistance=${v[repspl + "_spellresistance"] || ""}}}`;
			}
			// desc
			if ((v[`${repspl}_spelldescflag`]) && (v[`${repspl}_spelldescflag`] != "0")) {
				rollbase += ` {{descflag=[[1]]}} {{desc=${v[repspl + "_spelldesc"] || ""}}}`;
			}
			// roll attack
			if (atkflag != "0") {
				if (atktype != "0") {
					atktype = "@{" + atktype + "_mod}";
				}
				if (atkmod.length == 0) {
					atkmod = "0";
				}
				rollbase += atkflag + " {{roll=[[1d20cs>" + atkcritrange + "+" + atktype + " [" + pfoglobals_i18n_obj[(v[repspl + "_spellatktype"] || "0")] + "]+" + atkmod + " [Mod]+(@{attack_bonus}) [Temp]+(@{attack_condition}) [Condition]+@{rollmod_attack} [Query]]]}}";
				rollbase += " {{critconfirm=[[1d20cs20+" + atktype + " [" + pfoglobals_i18n_obj[(v[repspl + "_spellatktype"] || "0")] + "]+" + atkmod + " [Mod]+(@{attack_bonus}) [Temp]+(@{attack_condition}) [Condition]+@{rollmod_attack} [Query]+@{critconfirm_bonus} [Crit Confirm Bonus]]]}}";
				if (v.npc && v.npc != "1") {
					conditionsnote += "@{attack_condition_note}";
					rollbase += " {{conditionsflag=[[@{attack_condition}]]}} {{conditions=@{conditions_display}}}";
				}
			}
			// roll damage
			if ((dmgflag != "0") || (dmg2flag != "0")) {
				if (dmgflag != "0") {
					stemp = `${dmgbase} + @{damage_bonus} [Temp] + @{rollmod_damage} [Query]`;
					rollbase += `${dmgflag} {{dmg1=[[${stemp}]]}} {{dmg1type=${dmgtype}}}`;
					if ( (atkflag != "0") && (dmgcritmulti >1) ) { // Critical damage
						stemp = "";
						for (i = 1; i <= dmgcritmulti; i++) {
							stemp += `${(stemp.length > 0) ? " + " : ""}${dmgbase}`;
						}
						rollbase += ` {{dmg1crit=[[(${stemp}) + (@{rollmod_damage} * ${dmgcritmulti}) [Query]]]}}`;
					}
				}
				if (dmg2flag != "0") {
					rollbase += ` {{dmg2name=${dmg2name}}}`;
					stemp = `${dmg2base} + @{damage_bonus} [Temp] + @{rollmod_damage} [Query]`;
					rollbase += `${dmg2flag} {{dmg2=[[${stemp}]]}} {{dmg2type=${dmg2type}}}`;
					if ( (atkflag != "0") && (dmgcritmulti >1) ) { // Critical damage
						stemp = "";
						for (i = 1; i <= dmgcritmulti; i++) {
							stemp += `${(stemp.length > 0) ? " + " : ""}${dmg2base}`;
						}
						rollbase += ` {{dmg2crit=[[(${stemp}) + (@{rollmod_damage} * ${dmgcritmulti}) [Query]]]}}`;
					}
				}
			}
			// spell failure
			if (((v.npc || "0") != "1") && (spell_level != "like")) {
				if ( ((v.armor_spell_failure || "0") != "0") && ( (((v.caster1_spell_failure || "1") == "1") && (cster == "1")) || ((cster == "2") && ((v.caster2_spell_failure || "1") == "1"))) ) {
					rollbase += ` {{spellfailureroll=[[1d100]]}}`;
					rollbase += ` {{spellfailure=[[${v.armor_spell_failure}]]}}`;
					conditionsnote += "@{spell_condition_note}";
				}
			}
			// concentration
			if (((v.npc || "0") != "1") && (spell_level != "like") && v[`caster${cster}_concentration_roll`]) {
				update[`${repspl}_rollconcentration`] = v[`caster${cster}_concentration_roll`];
				rollbase += ` {{concentration=[${getTranslationByKey("concentration")}](~repeating_spell-${spell_level}_concentration)}}`;
			}
			// notes & conditions
			if ((v.npc || "0") != "1") {
				if (v["rollnotes_spell"] && (v["rollnotes_spell"] != "0") && v[`${repspl}_notes`]) {
					rollbase += ` {{shownotes=[[1]]}} {{notes=${v[repspl + "_notes"] || ""}}}`;
				}
				rollbase += ` {{conditionsnote=${conditionsnote}}}`;
			}
			// == update
			update[`${repspl}_spelldc`] = savedc;
			update[`${repspl}_rollcontent`] = rollbase;
			// End calc
			// console.log("*** DEBUG calc_spell update: " + JSON.stringify(update,null,"  "));
			return update;
		};

		// === CONDITIONS & BUFFS
		const calc_conditions = function(v, reset = false) {
			// console.log("*** DEBUG calc_conditions call, reset: " + reset);
			let dspl = "", update = {}, strength_condition = 0, dexterity_condition = 0, dexterity_condition_nobonus = 0, ability_check_condition = 0, ac_condition = 0, ac_condition_nobonus = 0, ac_condition_note = " ", cmd_condition = 0, skill_condition = 0, skill_condition_note = "", perception_condition_note = "", attack_condition = 0, attack_condition_note = "", cmb_condition_note = "", damage_condition_note = "", initiative_condition = 0, spell_condition_note = "", saves_condition = 0, hp_condition = 0, speed_condition = 0, speed_condition_multiplier = 1.0, speed_condition_nospeed = 0, speed_condition_norun = 0, i = 0;
			if (reset) {
				_.each(pfoglobals_conditions, (fld) => {
					update[fld] = 0;
				});
				update["options_flag_conditions"] = 0;
			} else {
				_.each(pfoglobals_conditions, (fld) => {
					if ((parseInt(v[fld]) || 0) > 0) {
						dspl += (dspl.trim().length ? " • " : "") + pfoglobals_i18n_obj[fld.replace("condition_","")];
						if (fld == "condition_blinded") {
							ac_condition -= 2;
							cmd_condition -= 2;
							ac_condition_nobonus = 1;
							skill_condition_note += getTranslationByKey("blinded-skills") + " ";
							perception_condition_note += getTranslationByKey("blinded-perception") + " ";
						}
						if (fld == "condition_cowering") {
							ac_condition -= 2;
							cmd_condition -= 2;
							ac_condition_nobonus = 1;
						}
						if (fld == "condition_dazzled") {
							perception_condition_note += getTranslationByKey("dazzled-perception") + " ";
							attack_condition -= 1;
						}
						if (fld == "condition_deafened") {
							perception_condition_note += getTranslationByKey("deafened-perception") + " ";
							initiative_condition -= 4;
							spell_condition_note += getTranslationByKey("deafened-spell") + " ";
						}
						if (fld == "condition_energy_drained") {
							i = parseInt(v["condition_energy_drained"]) || 1;
							dspl += " (" + i + ")";
							ability_check_condition -= i;
							initiative_condition -= i;
							cmd_condition -= i;
							skill_condition -= i;
							attack_condition -= i;
							saves_condition -= i;
							hp_condition -= (5*i);
						}
						if (fld == "condition_entangled") {
							dexterity_condition -= 4;
							attack_condition -= 2;
							speed_condition = 1;
							speed_condition_multiplier = Math.min(speed_condition_multiplier, 0.5);
							speed_condition_norun = 1;
						}
						if (fld == "condition_exhausted") {
							strength_condition -= 6;
							dexterity_condition -= 6;
							speed_condition = 1;
							speed_condition_multiplier = Math.min(speed_condition_multiplier, 0.5);
							speed_condition_norun = 1;
						}
						if (fld == "condition_fascinated") {
							skill_condition_note += getTranslationByKey("fascinated-skills") + " ";
						}
						if (fld == "condition_fatigued") {
							strength_condition -= 2;
							dexterity_condition -= 2;
						}
						if (fld == "condition_frightened") {
							ability_check_condition -= 2;
							skill_condition -= 2;
							attack_condition -= 2;
							initiative_condition -= 2;
							saves_condition -= 2;
						}
						if (fld == "condition_grappled") {
							dexterity_condition -= 4;
							attack_condition -= 2;
							cmb_condition_note += getTranslationByKey("grappled-cmb") + " ";
							speed_condition = 1;
							speed_condition_nospeed = 1;
						}
						if (fld == "condition_invisible") {
							attack_condition_note += getTranslationByKey("invisible-attack") + " ";
						}
						if (fld == "condition_panicked") {
							ability_check_condition -= 2;
							skill_condition -= 2;
							initiative_condition -= 2;
							saves_condition -= 2;
						}
						if (fld == "condition_pinned") {
							dexterity_condition_nobonus = 1;
							ac_condition_nobonus = 1;
							ac_condition -= 4;
							cmd_condition -= 4;
							speed_condition = 1;
							speed_condition_nospeed = 1;
						}
						if (fld == "condition_prone") {
							ac_condition_note += getTranslationByKey("prone-defender") + " ";
							attack_condition_note += getTranslationByKey("prone-attacker") + " ";
						}
						if (fld == "condition_shaken") {
							ability_check_condition -= 2;
							skill_condition -= 2;
							attack_condition -= 2;
							initiative_condition -= 2;
							saves_condition -= 2;
						}
						if (fld == "condition_sickened") {
							ability_check_condition -= 2;
							skill_condition -= 2;
							attack_condition -= 2;
							damage_condition_note += getTranslationByKey("sickened-damage") + " ";
							initiative_condition -= 2;
							saves_condition -= 2;
						}
						if (fld == "condition_stunned") {
							ac_condition -= 2;
							cmd_condition -= 2;
							ac_condition_nobonus = 1;
						}
					}
				});
			}
			update["strength_condition"] = strength_condition;
			update["dexterity_condition"] = dexterity_condition;
			update["ability_check_condition"] = ability_check_condition;
			update["dexterity_condition_nobonus"] = dexterity_condition_nobonus;
			update["ac_condition"] = ac_condition;
			update["ac_condition_nobonus"] = ac_condition_nobonus;
			update["ac_condition_note"] = ac_condition_note;
			update["cmd_condition"] = cmd_condition;
			update["skill_condition"] = skill_condition;
			update["skill_condition_note"] = skill_condition_note;
			update["perception_condition_note"] = perception_condition_note;
			update["attack_condition"] = attack_condition;
			update["attack_condition_note"] = attack_condition_note;
			update["cmb_condition_note"] = cmb_condition_note;
			update["damage_condition_note"] = damage_condition_note;
			update["initiative_condition"] = initiative_condition;
			update["spell_condition_note"] = spell_condition_note;
			update["saves_condition"] = saves_condition;
			update["hp_condition"] = hp_condition;
			update["speed_condition"] = speed_condition;
			update["speed_condition_multiplier"] = speed_condition_multiplier;
			update["speed_condition_nospeed"] = speed_condition_nospeed;
			update["speed_condition_norun"] = speed_condition_norun;
			update["conditions_display"] = (dspl.trim().length ? dspl.trim() : " ");
			return update;
		};
		const calc_buffs = function(repsec_agr, v, reset = false, skills_array = []) {
			let buffables = {"ac_armor_bonus":["ac_armor_bonus","ac_armor","armor","armor ac"],"ac_bonus":["ac_bonus","ac","armor class"],"ac_deflection_bonus":["ac_deflection_bonus","deflection","ac_deflection","deflection ac"],"ac_dodge_bonus":["ac_dodge_bonus","dodge","ac_dodge","dodge ac"],"ac_natural_bonus":["ac_natural_bonus","natural","ac_natural","natural ac"],"ac_shield_bonus":["ac_shield_bonus","shield","ac_shield","shield ac"],"acrobatics_bonus":["acrobatics_bonus","acrobatics","skill","skills"],"appraise_bonus":["appraise_bonus","appraise","skill","skills"],"attack_bonus":["attack_bonus","attack","attacks"],"bluff_bonus":["bluff_bonus","bluff","skill","skills"],"caster1_concentration_bonus":["caster1_concentration_bonus","concentration"],"caster1_dcbonus_level_0":["caster1_dcbonus_level_0","dc"],"caster1_dcbonus_level_1":["caster1_dcbonus_level_1","dc"],"caster1_dcbonus_level_2":["caster1_dcbonus_level_2","dc"],"caster1_dcbonus_level_3":["caster1_dcbonus_level_3","dc"],"caster1_dcbonus_level_4":["caster1_dcbonus_level_4","dc"],"caster1_dcbonus_level_5":["caster1_dcbonus_level_5","dc"],"caster1_dcbonus_level_6":["caster1_dcbonus_level_6","dc"],"caster1_dcbonus_level_7":["caster1_dcbonus_level_7","dc"],"caster1_dcbonus_level_8":["caster1_dcbonus_level_8","dc"],"caster1_dcbonus_level_9":["caster1_dcbonus_level_9","dc"],"caster2_concentration_bonus":["caster2_concentration_bonus","concentration"],"caster2_dcbonus_level_0":["caster2_dcbonus_level_0","dc"],"caster2_dcbonus_level_1":["caster2_dcbonus_level_1","dc"],"caster2_dcbonus_level_2":["caster2_dcbonus_level_2","dc"],"caster2_dcbonus_level_3":["caster2_dcbonus_level_3","dc"],"caster2_dcbonus_level_4":["caster2_dcbonus_level_4","dc"],"caster2_dcbonus_level_5":["caster2_dcbonus_level_5","dc"],"caster2_dcbonus_level_6":["caster2_dcbonus_level_6","dc"],"caster2_dcbonus_level_7":["caster2_dcbonus_level_7","dc"],"caster2_dcbonus_level_8":["caster2_dcbonus_level_8","dc"],"caster2_dcbonus_level_9":["caster2_dcbonus_level_9","dc"],"charisma_bonus":["charisma_bonus","charisma","cha"],"climb_bonus":["climb_bonus","climb","skill","skills"],"cmb_bonus":["cmb_bonus","cmb"],"cmd_bonus":["cmd_bonus","cmd"],"constitution_bonus":["constitution_bonus","constitution","con"],"craft_bonus":["craft_bonus","craft","skill","skills"],"dexterity_bonus":["dexterity_bonus","dexterity","dex"],"diplomacy_bonus":["diplomacy_bonus","diplomacy","skill","skills"],"disable_device_bonus":["disable_device_bonus","disabledevice","disable device","skill","skills"],"disguise_bonus":["disguise_bonus","disguise","skill","skills"],"encumbrance_load_bonus":["encumbrance_load_bonus","encumbrance"],"escape_artist_bonus":["escape_artist_bonus","escapeartist","escape artist","skill","skills"],"fly_bonus":["fly_bonus","fly","skill","skills"],"fortitude_bonus":["fortitude_bonus","fortitude","fort","saves","saving throws"],"handle_animal_bonus":["handle_animal_bonus","handleanimal","handle animal","skill","skills"],"heal_bonus":["heal_bonus","heal","skill","skills"],"hp_bonus":["hp_bonus","hp","hit points"],"hp_temp":["hp_temp","temp hp","temp hits points","temporary hp","temporary hit points"],"initiative_bonus":["initiative_bonus","initiative","init"],"intelligence_bonus":["intelligence_bonus","intelligence","int"],"intimidate_bonus":["intimidate_bonus","intimidate","skill","skills"],"knowledge_arcana_bonus":["knowledge_arcana_bonus","knowledge(arcana)","knowledgearcana","knowledge (arcana)","knowledge arcana","arcana","knowledge","skill","skills"],"knowledge_dungeoneering_bonus":["knowledge_dungeoneering_bonus","knowledge(dungeoneering)","knowledgedungeoneering","knowledge (dungeoneering)","knowledge dungeoneering","dungeoneering","knowledge","skill","skills"],"knowledge_engineering_bonus":["knowledge_engineering_bonus","knowledge(engineering)","knowledgeengineering","knowledge (engineering)","knowledge engineering","engineering","knowledge","skill","skills"],"knowledge_geography_bonus":["knowledge_geography_bonus","knowledge(geography)","knowledgegeography","knowledge (geography)","knowledge geography","geography","knowledge","skill","skills"],"knowledge_history_bonus":["knowledge_history_bonus","knowledge(history)","knowledgehistory","knowledge (history)","knowledge history","history","knowledge","skill","skills"],"knowledge_local_bonus":["knowledge_local_bonus","knowledge(local)","knowledgelocal","knowledge (local)","knowledge local","local","knowledge","skill","skills"],"knowledge_nature_bonus":["knowledge_nature_bonus","knowledge(nature)","knowledgenature","knowledge (nature)","knowledge nature","nature","knowledge","skill","skills"],"knowledge_nobility_bonus":["knowledge_nobility_bonus","knowledge(nobility)","knowledgenobility","knowledge (nobility)","knowledge nobility","nobility","knowledge","skill","skills"],"knowledge_planes_bonus":["knowledge_planes_bonus","knowledge(planes)","knowledgeplanes","knowledge (planes)","knowledge planes","planes","knowledge","skill","skills"],"knowledge_religion_bonus":["knowledge_religion_bonus","knowledge(religion)","knowledgereligion","knowledge (religion)","knowledge religion","religion","knowledge","skill","skills"],"linguistics_bonus":["linguistics_bonus","linguistics","skill","skills"],"melee_bonus":["melee_bonus","melee"],"perception_bonus":["perception_bonus","perception","skill","skills"],"perform_bonus":["perform_bonus","perform","skill","skills"],"profession_bonus":["profession_bonus","profession","skill","skills"],"ranged_bonus":["ranged_bonus","ranged"],"reflex_bonus":["reflex_bonus","reflex","ref","saves","saving throws"],"ride_bonus":["ride_bonus","ride","skill","skills"],"sense_motive_bonus":["sense_motive_bonus","sensemotive","sense motive","skill","skills"],"sleight_of_hand_bonus":["sleight_of_hand_bonus","sleightofhand","sleight of hand","skill","skills"],"speed_bonus":["speed_bonus","speed"],"speed_climb_bonus":["speed_climb_bonus","speed climb","climb speed"],"speed_swim_bonus":["speed_swim_bonus","speed swim","swim speed"],"spellcraft_bonus":["spellcraft_bonus","spellcraft","skill","skills"],"stealth_bonus":["stealth_bonus","stealth","skill","skills"],"strength_bonus":["strength_bonus","strength","str"],"survival_bonus":["survival_bonus","survival","skill","skills"],"swim_bonus":["swim_bonus","swim","skill","skills"],"use_magic_device_bonus":["use_magic_device_bonus","usemagicdevice","use magic device","skill","skills"],"will_bonus":["will_bonus","will","saves","saving throws"],"wisdom_bonus":["wisdom_bonus","wisdom","wis"],"sr_bonus":["sr_bonus","sr","spell resistance","spell_resistance"],"damage_bonus":["damage_bonus","damage","damages"],"melee_damage_bonus":["melee_damage_bonus","melee damage"],"ranged_damage_bonus":["ranged_damage_bonus","ranged damage"]};
			// Completing buffables with repeating skills
			if (skills_array.length) {
				_.each(skills_array, (repsk) => {
					buffables[`${repsk}_bonus`] = [`${repsk}_bonus`,"skill","skills",repsk.match(/repeating\_skill[^\_]+/i)[0].replace('repeating_skill','')];
				});
			}
			let update = {}, dspl = "", toggled = [], bytype = {};
			_.each(repsec_agr, (current_section) => {
				// console.log("*** DEBUG calc_buffs section: " + current_section.section);
				_.each(current_section.ids, (buffid) => {
					if (reset) {
						// Clearing buffs toggle
						update[`repeating_buff_${buffid}_toggle`] = "0";
					} else if (v[`repeating_buff_${buffid}_toggle`] && v[`repeating_buff_${buffid}_toggle`] == "1") {
						// Display handling
						dspl += `${dspl.trim().length ? " • " : ""}${v["repeating_buff_" + buffid + "_name"] || "???"}`;
					}
					// Collecting various buff
					if (v[`repeating_buff_${buffid}_mods`] && v[`repeating_buff_${buffid}_mods`].trim().length) {
						update[`repeating_buff_${buffid}_showmods`] = v[`repeating_buff_${buffid}_mods`].replace(/\{/g,"&#123;").replace(/\}/g,"&#125;");
						toggled = toggled.concat(...v[`repeating_buff_${buffid}_mods`]
							.trim()
							.toLowerCase()
							.split(/[\n|\;]/g)
							.map((str) => {
								let strParts = str.match(/((?:\+|\-)?.*?(?=(?:[a-z\s]+)?\s+to\s+))(?:\s+([a-z\s]+))?(?:\s+to\s+)([^;\n$]+)/i);
								if (strParts && strParts[1] && strParts[3]) {
									// Building buff object
									let formula = "", type = "", tmpstat = "", objarray = [];
									if (reset || (!v[`repeating_buff_${buffid}_toggle`]) || (v[`repeating_buff_${buffid}_toggle`] && v[`repeating_buff_${buffid}_toggle`] != "1")) {
										formula = 0;
									} else {
										// toggled buff
										formula = parse_formula(strParts[1],v);
									}
									type = strParts[2] || "untyped";
									tmpstat = strParts[3]; // maybe an alias
									// Checking if stat is buffable
									if (tmpstat in buffables) { //alias is a buffable stat
										// obj["stat"] = tmpstat;
										objarray.push({"stat": tmpstat,"value":formula, "type": type});
									} else {
										// Gathering all buffable stats from the alias
										_.each(Object.keys(buffables), (key) => {
											if (buffables[key].includes(tmpstat)) {
												objarray.push({"stat": key,"value":formula, "type": type});
											}
										});
									}
									return objarray;
								}
							})
							.filter(x => x != null)
						);
					}
				});
			});
			// Any buffs to apply?
			if (toggled.length) {
				// Stacking by buff type
				_.each(toggled, (buff) => {
					// Special cases for AC
					if ((buff.stat == "ac_bonus") && (["dodge","armor","shield","natural","deflection"].includes(buff.type))) {
						buff.stat = `ac_${buff.type}_bonus`;
						buff.type = "untyped";
					}
					// Adding or maxing by type and stat
					if (!bytype[buff.stat]) {
						bytype[buff.stat] = {};
					}
					if (!bytype[buff.stat][buff.type]) {
						if (["dodge","untyped","circumstance"].includes(buff.type)) {
							bytype[buff.stat][buff.type] = 0;
						} else {
							bytype[buff.stat][buff.type] = -999;
						}
					}
					if (["dodge","untyped","circumstance"].includes(buff.type)) { // stacking
						bytype[buff.stat][buff.type] += (parseInt(buff.value) || 0);
					} else { // Not stacking: keep the maximum
						bytype[buff.stat][buff.type] = Math.max((parseInt(bytype[buff.stat][buff.type]) || 0),(parseInt(buff.value) || 0));
					}
				});
				// Applying buffs totals
				_.each(Object.keys(bytype), (buff) => {
					update[buff] = Object.values(bytype[buff]).reduce((a, b)=> a + b,0);
				});
			}
			// Temp HP special case
			if ("hp_temp" in update) {
				update["hp_temp"] = Math.max( (parseInt(v["hp_temp"]) || 0), (parseInt(update["hp_temp"]) || 0));
			}
			// Subwindow handling
			if (reset) {
				update["options_flag_conditions"] = 0;
			}
			// Updating
			update["buffs_display"] = (dspl.trim().length ? dspl.trim() : " ");
			// console.log("*** DEBUG calc_buffs update: " + JSON.stringify(update,null,"  "));
			return update;
		};

// =============================================================================
// -----------------------------------------------------------------------------
// # Module : RECALCULATE
// -----------------------------------------------------------------------------
// =============================================================================

		const recalculate = function(ability, opts = {}, callback = null) {
			let debug_start = new Date();

			// console.log("*** DEBUG recalculate start for ability: " + ability + ", at " + debug_start);

			// Gathering repsection IDs
			let all_repsecs = [...pfoglobals_repsec_atk, ...pfoglobals_repsec_spell, ...pfoglobals_repsec_skills, ...pfoglobals_repsec_buff, ...pfoglobals_repsec_traits];
			get_repsec_ids(JSON.parse(JSON.stringify(all_repsecs)), (repsec_agr) => {

				// Gathering attributes
				let tmpfields = [];
				// Add size, level and other special fields
				tmpfields.push("size","level","hp_base","hp_base_max","hp_condition","hp_bonus","hp_temp","dexterity_condition_nobonus","sr_base","sr_bonus");
				// Add saves
				_.each(["fortitude","reflex","will"],(savename) => {
					tmpfields.push(...pfoglobals_save_attr.map((fld) => `${savename}_${fld}`));
				});
				// Add skills
				_.each(pfoglobals_skill_list,(skillname) => {
					tmpfields.push(...pfoglobals_skill_attr.map((skillattr) => skillname + "_" + skillattr));
				});
				tmpfields.push(...pfoglobals_skillranks_fields);
				// All other fixed ones
				tmpfields.push(...pfoglobals_abilities, ...pfoglobals_abilities_fields, ...pfoglobals_mods, ...pfoglobals_flex_abilities, ...pfoglobals_initiative_fields, ...pfoglobals_ac_ability_fields, ...pfoglobals_ac_fields, ...pfoglobals_babs_fields, ...pfoglobals_skill_fields, ...pfoglobals_atk_fields, ...pfoglobals_spell_fields, ...pfoglobals_concentration_fields, ...pfoglobals_spells_dc_fields, ...pfoglobals_encumbrance_fields, ...pfoglobals_speed_fields, ...pfoglobals_conditions);
				// Remove duplicates
				let fixed_fields = Array.from(new Set(tmpfields));
				// Add repsec fields
				let all_fields = get_repsec_fields(repsec_agr,fixed_fields);
				// Gathering values
				getAttrs(all_fields, (v) => {
					if ((v["npc"] || "0") == "1") {
						return; // Exit if NPC
					}
					// console.log("*** DEBUG recalculate : " + JSON.stringify(v,null,"  "));
					let big_update = {};
					let update = {};
					// Preparing repeating skills ids in advance for buffs
					let skills_array = [];
					_.each(repsec_agr.filter(current_section => current_section.section.substr(0,5) == "skill"), (repsec) => {
						skills_array.push(...repsec.ids.map((id) => `repeating_${repsec.section}_${id}`));
					});
					// --- Conditions & Buffs
					update = calc_conditions(v, (true && opts.reset_conditions));
					_.extend(big_update, update);
					_.extend(v, update);
					update = calc_buffs(repsec_agr.filter(current_section => current_section.section == "buff"),v, (true && opts.reset_buffs), skills_array);
					_.extend(big_update, update);
					_.extend(v, update);
					// --- Abilities
					if (["strength","all"].includes(ability)) {
						if (v.npc != "1") {
							update = calc_ability("strength",v);
							_.extend(big_update, update);
							_.extend(v, update);
						}
						update = calc_ability_mod("strength",v);
						_.extend(big_update, update);
						_.extend(v, update);
						if (v.npc != "1") {
							// Encumbrance
							update = calc_encumbrance(v);
							_.extend(big_update, update);
							_.extend(v, update);
							// Speed
							update = calc_speed(v);
							_.extend(big_update, update);
							_.extend(v, update);
						}
					}
					if (["dexterity","all"].includes(ability)) {
						if (v.npc != "1") {
							update = calc_ability("dexterity",v);
							_.extend(big_update, update);
							_.extend(v, update);
						}
						update = calc_ability_mod("dexterity",v);
						_.extend(big_update, update);
						_.extend(v, update);
					}
					if (["constitution","all"].includes(ability)) {
						if (v.npc != "1") {
							update = calc_ability("constitution",v);
							_.extend(big_update, update);
							_.extend(v, update);
						}
						update = calc_ability_mod("constitution",v);
						_.extend(big_update, update);
						_.extend(v, update);
					}
					if (["intelligence","all"].includes(ability)) {
						if (v.npc != "1") {
							update = calc_ability("intelligence",v);
							_.extend(big_update, update);
							_.extend(v, update);
						}
						update = calc_ability_mod("intelligence",v);
						_.extend(big_update, update);
						_.extend(v, update);
					}
					if (["wisdom","all"].includes(ability)) {
						if (v.npc != "1") {
							update = calc_ability("wisdom",v);
							_.extend(big_update, update);
							_.extend(v, update);
						}
						update = calc_ability_mod("wisdom",v);
						_.extend(big_update, update);
						_.extend(v, update);
					}
					if (["charisma","all"].includes(ability)) {
						if (v.npc != "1") {
							update = calc_ability("charisma",v);
							_.extend(big_update, update);
							_.extend(v, update);
						}
						update = calc_ability_mod("charisma",v);
						_.extend(big_update, update);
						_.extend(v, update);
					}
					// --- Size
					update = calc_pc_size(v.size);
					_.extend(big_update, update);
					_.extend(v, update);
					// --- Flex abilities
					update = {};
					_.each(pfoglobals_flex_abilities, (ablt) => {
						update[`${ablt}_mod`] = v[`${v[ablt]}_mod`];
					});
					_.extend(big_update, update);
					_.extend(v, update);
					// --- HP
					big_update["hp"] = (parseInt(v.hp_base) || 0) + (parseInt(v.hp_condition) || 0) + (parseInt(v.hp_bonus) || 0);
					big_update["hp_max"] = (parseInt(v.hp_base_max) || 0) + (parseInt(v.hp_condition) || 0) + (parseInt(v.hp_bonus) || 0);
					big_update["hp_mod"] = (parseInt(v.hp_condition) || 0) + (parseInt(v.hp_bonus) || 0);
					if (parseInt(big_update["hp_mod"]) > 0) {
						big_update["hp_mod_flag"] = 2;
					} else if (parseInt(big_update["hp_mod"]) < 0) {
						big_update["hp_mod_flag"] = 1;
					} else {
						big_update["hp_mod_flag"] = 0;
					}
					// --- Initiative
					update = calc_initiative(v);
					_.extend(big_update, update);
					_.extend(v, update);
					// --- AC
					update = calc_ac_ability(ability,v);
					_.extend(big_update, update);
					_.extend(v, update);
					update = calc_ac(v);
					_.extend(big_update, update);
					_.extend(v, update);
					// --- BABs and CMD
					update = calc_babs_all(v);
					_.extend(big_update, update);
					_.extend(v, update);
					// --- Saves
					_.each(["fortitude","reflex","will"],(savename) => {
						update = calc_save(savename, v);
						_.extend(big_update, update);
						_.extend(v, update);
					});
					// --- Spell Resistance
					update = calc_sr(v);
					_.extend(big_update, update);
					_.extend(v, update);
					// --- Concentration & Spell DC
					if (v.caster1_flag == "1") {
						update = calc_concentration("caster1",v);
						_.extend(big_update, update);
						_.extend(v, update);
						update = calc_spells_dc("caster1",v,0,10);
						_.extend(big_update, update);
						_.extend(v, update);
					}
					if (v.caster2_flag == "1") {
						update = calc_concentration("caster2",v);
						_.extend(big_update, update);
						_.extend(v, update);
						update = calc_spells_dc("caster2",v,0,10);
						_.extend(big_update, update);
						_.extend(v, update);
					}
					// --- Skill Points & Skills
					update = calc_skillranks_total(v);
					_.extend(big_update, update);
					skills_array.push(...pfoglobals_skill_list); // Completing skills list from before buffs
					update = calc_skill(skills_array, v, true, true); // Also check if class skill flag matches class skill checkbox
					_.extend(big_update, update);
					_.extend(v, update);
					// --- Attacks
					_.extend(big_update, calc_damage_bonus_flag(v));
					update = calc_attacks(repsec_agr.filter(current_section => current_section.section == "attacks"), v, "all");
					_.extend(big_update, update);
					// --- Spells
					if ((v.caster1_flag == "1") || (v.caster2_flag == "1")) {
						update_mp(); // NEW
						update_all_spells_known(); // NEW
						update_all_spell_cost(); // NEW
						update_all_domain_school(); // NEW
						update = calc_spells(["0","1","2","3","4","5","6","7","8","9","like"],repsec_agr.filter(current_section => current_section.section.substr(0,6) == "spell-"), v, "all");
						_.extend(big_update, update);
					}
					// --- Traits
					update = calc_traits(repsec_agr.filter(current_section => current_section.section == "abilities"), v);
					_.extend(big_update, update);

					// NEW -- Update speed unit and AC Items
					if (opts.reset_speed_unit) {
						update_speed_unit(null, true); // force update (invovle update_ac_items)
					} else {
						update_ac_items();
					}

					// Update (finally)
					// console.log("*** DEBUG recalculate big_update: " + JSON.stringify(big_update,null,"  "))
					// console.log("*** DEBUG recalculate v: " + JSON.stringify(v,null,"  "));
					setAttrs(big_update, {silent: true}, () => {
						var elapsed = new Date() - debug_start;
						console.log("Pathfinder sheet updated (" + elapsed + "ms)");
						if (callback) {
							callback();
						}
					});
				});
			});
		};

// =============================================================================
// -----------------------------------------------------------------------------
// # Module : USER INTERFACE
// -----------------------------------------------------------------------------
// =============================================================================

		const open_migrate_confirm = function() { // NEW
			setAttrs({"migrate_confirm_flag" : "1"});
		};
		const close_migrate_confirm = function(s) { // s = console string // NEW
			setAttrs({"migrate_confirm_flag" : "0"});
			if (s !== undefined) {
				console.info(s); // DEBUG
			}
		};
		const switch_caster_level = function(src) { // src = trigger source // NEW
			let num = src.substr(14,1); // => 1
			let dir = src.substr(16,4); // => more
			let max, i, n = 0, m = 0, update = {};
			getAttrs(["caster1_level_ctrl", "caster2_level_ctrl"], (v) => {
				n = Math.min(Math.max(parseInt(v[`caster${num}_level_ctrl`] || 0) + (dir == "more" ? 1 : -1), 0), 9);
				m = parseInt(v[`caster${num == "1" ? "2" : "1"}_level_ctrl`] || 0);
				max = Math.max(n, m);
				for (i = 0; i <= 9; i++) update[`caster_spells_flag_level_${i}`] = i <= max ? "1" : "0";
				update[`caster${num}_level_ctrl`] = n;
				setAttrs(update);
			});
		};

// =============================================================================
// -----------------------------------------------------------------------------
// # Module : UTILITIES
// -----------------------------------------------------------------------------
// =============================================================================

		const get_repsec_ids = function(repsec_array,callback,repsec_agr) {
			// Returns an array of objects, aggregating ids and attributes for various repeating sections items
			// Parameters: Source (like pfoglobals_repsec_spell), callback function, Aggregate ([{section:string, ids:[ids], attrs:[attribute]}])
			// Courtesy of Scott C. :)
			let currsection = repsec_array.shift();
			if (currsection.section) {
				// console.log("*** DEBUG get_repsec_ids section: " + currsection.section);
				repsec_agr = repsec_agr || [];
				getSectionIDs(`repeating_${currsection.section}`, (itemsids) => {
					repsec_agr.push({
						section:currsection.section,
						ids:itemsids,
						attrs:currsection.attrs
					});
					if (_.isEmpty(repsec_array)) {
						callback(repsec_agr);
					} else {
						get_repsec_ids(repsec_array,callback,repsec_agr);
					}
				});
			} else {
				if (_.isEmpty(repsec_array)) {
					callback(repsec_agr);
				} else {
					get_repsec_ids(repsec_array,callback,repsec_agr);
				}
			}
		};
		const get_repsec_fields = function(repsec_agr, other_attrs = []) {
			// Returns an array of attribute names from several repeating sections and optional other standard attributes
			// Parameters: Reapting section Aggregate ([{section:string, ids:[ids], attrs:[attributes]}]), [other attributes names]
			let fields = [], repsecfields = [];
			_.each(repsec_agr, (current_section) => {
				// console.log("*** DEBUG get_repsec_fields section: " + current_section.section);
				_.each(current_section.ids, (id) => {
					// console.log("*** DEBUG get_repsec_fields ids: " + id);
					_.each(current_section.attrs, (attr) => {
						// console.log("*** DEBUG get_repsec_fields attrs: " + attr);
						repsecfields.push(`repeating_${current_section.section}_${id}_${attr}`);
					});
				});
			});
			fields = repsecfields.concat(other_attrs);
			return fields;
		};
		const toTitleCase = function(str) {
			return str.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			});
		};
		const erase_repsec_ids = function(sectionArray, callback) {
			// console.log("*** DEBUG erase_repsec_ids: " + sectionArray);
			let thisSection = sectionArray.shift();
			getSectionIDs(thisSection, (itemids) => {
				_.each(itemids, (item) => {
					removeRepeatingRow(`repeating_${thisSection}_${item}`);
				});
				if (sectionArray.length > 0) {
					erase_repsec_ids(sectionArray, callback);
				} else {
					callback();
				}
			});
		};
		const parse_formula = function(formula, v) { // Turning a macro formula into a value (no dice handling)
			if ((formula || "").length) {
				let value = 0;
				let string = (formula || "")
					.replace(/\[[\w\s]+\]/gi, "")
					.replace(/\[\[/g, "(")
					.replace(/\]\]/g, ")")
					.replace(/[\[\]]*/g, "")
					.replace(/(floor|ceil|abs|round|max|min)\(/g, "Math.$1(")
					.replace(/@{([^}]+)}/g, (match, p) => { return parseInt(v[p.toLowerCase()]) || 0 });
				try {
					value = eval(string);
				} catch (error) {
					console.error("parse_formula: " + formula + " -> " + string + " -- Error: " + error);
				} return value;
			} else {
				return 0;
			}
		};
		const parse_compendium_formula = function(formula = "", caster = "1", inline = false) {
			let fnl = "" + formula.trim();
			// https://regex101.com/r/lqwmNy/5
			//
			// 1d6 [anything] per Caster Level ([anything] maximum 10d6)
			// (\d+)(d\d+)([^$,\.]*per\s+caster\s+level\s+\([^\)]*maximum\s+)(\d+)(d\d+\))
			// $1$2$3$4$5
			// [[($1*{@{caster1_level}),$4}kl1]]$2
			// [[(1*{@{caster1_level}),10}kl1]]d6
			//
			// https://regex101.com/r/UWVy6i/1
			//
			// 1d6 [anything] per two Caster Levels ([anything] maximum 10d6)
			// (\d+)(d\d+)([^$,\.]*per\s+two\s+caster\s+levels\s+\([^\)]*maximum\s+)(\d+)(d\d+\))
			// $1$2$3$4$5
			// [[{@{caster1_level,$3}kl1]]$2
			// ({@{caster1_level},10}kl1)d6
			//
			// https://regex101.com/r/cLWT7i/3
			//
			// 1d8 points of fire Damage + 1 point per Caster Level ([anything] maximum +5)
			// 4d8+1 per Caster Level (maximum +35)
			// (\d+d\d+)([^,\.]*?(?=\+))(\+\s*)(\d+)(.+?(?=per))(per\s+caster\s+level\s+\(maximum\s+\+)(\d+)(\s*\))
			// $1$2$3$4$5$6$7$8
			// $1+{($4*@{caster1_level}),$7}kl1
			//
			// 2d10 rounds => /(\d+d\d+)( rounds)/gi => 2d10 rounds ([[2d10]])
			//
			// https://regex101.com/r/t2ZZ8t/1
			//  Divine favor
			// +1 morale bonus on attack rolls and weapon damage rolls against that designated creature for every three caster levels you have (at least +1, maximum +3)
			// (\+\s*)(\d+)(.*?(?=bonus))(.+?(?=for every three caster levels))(for every three caster levels)(.+?(?=maximum))(maximum\s+\+)(\d+)(\s*\))
			//
			// {"reg":``, "mod":"gi", "ori":`` ,"rep":``}
			if (formula && formula.length) {
				let regexp;
				let regreparr = [
					{"reg":`(\\d+)(d\\d+)([^$,\\.]*per\\s+caster\\s+level\\s+\\([^\\)]*maximum\\s+)(\\d+)(d\\d+\\))`, "mod":"gi", "ori":`$1$2$3$4$5`, "rep":`[[{($1*@{caster${caster}_level}),$4}kl1]]$2`},
					{"reg":`(\\d+)(d\\d+)([^$,\\.]*per\\s+two\\s+caster\\s+levels\\s+\\([^\\)]*maximum\\s+)(\\d+)(d\\d+\\))`, "mod":"gi", "ori":`$1$2$3$4$5`, "rep":`[[{($1*[[{floor((@{caster${caster}_level}/2)),1}kh1]]),$4}kl1]]$2`},
					{"reg":`(\\d+d\\d+)([^,\\.]*?(?=\\+))(\\+\\s*)(\\d+)(.+?(?=per))(per\\s+caster\\s+level\\s+\\(maximum\\s+\\+)(\\d+)(\\s*\\))`, "mod":"gi", "ori":`$1$2$3$4$5$6$7$8`, "rep":`$1+{($4*@{caster${caster}_level}),$7}kl1`},
					{"reg":`(\\d+d\\d+)(\\s+rounds)`,"mod":"gi", "ori":`$1$2`, "rep":`$1`}
				];
				_.each(regreparr, (regrep) => {
					regexp = new RegExp(regrep.reg,regrep.mod);
					if (fnl.match(regexp)) {
						if (inline) {
							fnl = fnl.replace(regexp,`${regrep.ori} ([[${regrep.rep}]])`);
						} else {
							fnl = fnl.replace(regexp,regrep.rep);
						}
					}
				});
			}
			return fnl;
		};

// =============================================================================
// -----------------------------------------------------------------------------
// # Module : RESET, INITIALIZE and OPEN
// -----------------------------------------------------------------------------
// =============================================================================

		// === RESET
		const reset_to_xpc = function(npcvalue) { // 0 = PC, 1 = NPC
			// reset and revert from NPC to PC or PC to NPC
			setAttrs({"initialize_character_flag" : 1, "npc" : npcvalue}, {silent: true}, () => {
				erase_repsec_ids(JSON.parse(JSON.stringify(pfoglobals_allrepsecs)), () => { // delete repeating sections
					setAttrs(calc_reset_character(), {silent: true}, (npcvalue) => { // reset other attributes
						if (npcvalue == 0) {
							recalculate("all", {}, () => {
								versioning();
								setAttrs({"initialize_character_flag": 0, "npc_confirm_flag": 0}, {silent: true});
							}); // recalculate all for PC
						} else {
							setAttrs({"initialize_character_flag": 0, "npc_confirm_flag": 0}, {silent: true});
						}
					});
				});
			});
		};
		const calc_reset_character = function() {
			let update = {};

			// --- Reset to empty string
			let toResetAsChar = ["race","class","class1_name","class2_name","class3_name","languages","senses","ac_notes","fortitude_notes","reflex_notes","will_notes","caster1_class","caster2_class","caster1_spells_notes","caster2_spells_notes","initiative_notes","speed_notes","encumbrance_display","encumbrance_load_notes","additional_gear","misc_notes","background","bab_notes","cmb_notes","melee_notes","ranged_notes","cmd_notes","sr_notes","craft_name","perform_name","profession_name","npc_alignment","aura","hd_roll","saves_modifiers","defensive_abilities","npc_type","npc_dr","immune","resist","weaknesses","npc_speed","space","reach","npc_spellabilities_notes","npc_spells_notes","tactics","skills_racial_modifiers","skills_notes","sq","combat_gear","environment","organization","npcdrop_name","npcdrop_uniq","npcdrop_category","npcdrop_data","npc_icon_type","npc_icon_terrain","npc_icon_climate","npc_cr","npc_mr","treasure","mp_max_base","mp_notes","caster1_domain1","caster1_domain2","caster1_school_speciality","caster1_school_opposition1","caster1_school_opposition2","caster2_domain1","caster2_domain2","caster2_school_speciality","caster2_school_opposition1","caster2_school_opposition2"]; // EDIT
			toResetAsChar = toResetAsChar.concat(pfoglobals_abilities.map((ablt) => `${ablt}_notes`));
			toResetAsChar = toResetAsChar.concat(pfoglobals_skill_list.map((sk) => `${sk}_notes`));
			toResetAsChar = toResetAsChar.concat(pfoglobals_skill_list.map((sk) => `${sk}_display`));
			_.each(toResetAsChar,(attr) => {
				update[attr] = "";
			});

			// --- Reset to zero
			var toResetAsZero = ["hp_base","hp_base_max","hp","hp_max","mancer_confirm_flag","caster_flag","class1_level","class2_level","class3_level","money_cp","money_sp","money_gp","money_pp","xp","sr","spells_flag","spellabilities_flag","mp","mp_max","mp_temp","mp_pool"];
			for (var i = 1; i < 4; i++) {
				toResetAsZero.push(`class${i}_bab`,`class${i}_fortitude`,`class${i}_reflex`,`class${i}_will`,`class${i}_skillranks_base`,`class${i}_skillranks_misc`,`class${i}_speed`); // EDIT
			}
			for (var j = 1; j < 3; j++) {
				for (var i = 0; i < 10; i++) {
					toResetAsZero.push(`caster${j}_spells_known_level_${i}`, `caster${j}_spells_perday_level_${i}`, `caster${j}_spells_bonus_level_${i}`, `caster${j}_spells_prepared_level_${i}`, `caster${j}_spells_total_level_${i}`, `caster${j}_dc_level_${i}`, `caster${j}_dcbonus_level_${i}`, `caster${j}_mp_known_level_${i}`, `caster${j}_mp_known_bonus_level_${i}`, `caster${j}_mp_known_total_level_${i}`, `caster_spells_flag_level_${i}`); // EDIT
				}
			}

			toResetAsZero = toResetAsZero.concat(pfoglobals_abilities.map((ablt) => `${ablt}_race`));
			toResetAsZero = toResetAsZero.concat(pfoglobals_abilities.map((ablt) => `${ablt}_bonus`));
			toResetAsZero = toResetAsZero.concat(pfoglobals_abilities.map((ablt) => `${ablt}_condition`));

			toResetAsZero = toResetAsZero.concat(pfoglobals_skill_list);
			toResetAsZero = toResetAsZero.concat(pfoglobals_skill_list.map((sk) => `${sk}_classkill`));
			toResetAsZero = toResetAsZero.concat(pfoglobals_skill_list.map((sk) => `${sk}_ability_mod`));
			toResetAsZero = toResetAsZero.concat(pfoglobals_skill_list.map((sk) => `${sk}_ranks`));
			toResetAsZero = toResetAsZero.concat(pfoglobals_skill_list.map((sk) => `${sk}_misc`));
			toResetAsZero = toResetAsZero.concat(pfoglobals_skill_list.map((sk) => `${sk}_bonus`));
			toResetAsZero = toResetAsZero.concat(pfoglobals_skill_list.map((sk) => `${sk}_flag`));
			toResetAsZero = toResetAsZero.concat(pfoglobals_skill_list.map((sk) => `${sk}_base_mod`)); // NEW
			toResetAsZero = toResetAsZero.concat(pfoglobals_skill_list.map((sk) => `${sk}_class_skill_bonus`)); // NEW
			toResetAsZero = toResetAsZero.concat(pfoglobals_skill_list.map((sk) => `${sk}_check_penalty_value`)); // NEW

			toResetAsZero = toResetAsZero.concat(pfoglobals_mods,["initiative","initiative_misc","initiative_bonus"],["fortitude","fortitude_base","fortitude_ability_mod","fortitude_misc","fortitude_bonus","reflex","reflex_base","reflex_ability_mod","reflex_misc","reflex_bonus","will","will_base","will_ability_mod","will_misc","will_bonus"],["encumbrance_ability_maximum"],["ac_condition_nobonus","ac_bonus","ac_ability_mod","ac_armor","ac_shield","ac_size","ac_natural_items","ac_deflection_items","ac_misc","ac_dodge_items","ac_touch_items","ac_flatfooted_items","ac_natural_bonus","ac_deflection_bonus","ac_dodge_bonus","ac_noflatflooted","ac_touchshield","ac_condition","ac_secab_monk","ac_ff_ability_mod"],["bab","bab_max","bab_multi","bab_size","cmb_mod","cmb_size","cmb_ability_mod","cmb_misc","cmb_bonus","melee_mod","melee_ability_mod","melee_misc","melee_bonus","ranged_mod","ranged_ability_mod","ranged_misc","ranged_bonus","cmd_misc","cmd_bonus","cmd_condition","fob","fob_multi"],pfoglobals_skill_fields,["caster1_flag","caster2_flag","caster1_level","caster1_ability_mod","caster1_concentration","caster1_concentration_misc","caster1_concentration_bonus","caster2_level","caster2_ability_mod","caster2_concentration","caster2_concentration_misc","caster2_concentration_bonus"],["encumbrance_load_bonus","stealth_size","encumbrance_size","fly_size","encumbrance_gear_weight","encumbrance_load_light","encumbrance_load_medium","encumbrance_load_heavy","encumbrance"],["encumbrance","speed_notmodified","speed_bonus","speed_condition_multiplier","speed_condition_norun","speed_condition_nospeed","speed_class"],pfoglobals_conditions,["armor_spell_failure","caster1_dc_misc","caster2_dc_misc"]);

			toResetAsZero = _.uniq(toResetAsZero);
			_.each(toResetAsZero,(attr) => {
				update[attr] = 0;
			});

			// --- Reset to One (1)
			var toResetAsOne = ["class1_level","level","class_favored","encumbrance_load_multiplier","caster1_spell_failure","caster2_spell_failure","meleeattacks_flag","rangedattacks_flag","specialattacks_flag","special_abilities_flag","ecology_flag","tactics_flag"];
			_.each(toResetAsOne,(attr) => {
				update[attr] = 1;
			});

			// --- Reset to default value
			_.each(pfoglobals_abilities, (ablt) => {
				update[ablt] = 10;
				update[ablt + "_base"] = 10;
			});
			update["alignment"] = "neutral";
			update["size"] = "medium";
			update["ac"] = 10;
			update["ac_touch"] = 10;
			update["ac_flatfooted"] = 10;
			update["class1_hitdietype"] = 8;
			update["class2_hitdietype"] = 8;
			update["class3_hitdietype"] = 8;
			update["xp_max"] = 2000;
			update["encumbrance_run_factor"] = 4;
			update["armor_run_factor"] = 4;
			update["ac_ability_primary"] = "dexterity";
			update["ac_ability_secondary"] = "";
			update["ac_ability_maximum"] = "-";

			update["fortitude_ability"] = "constitution";
			update["reflex_ability"] = "dexterity";
			update["will_ability"] = "wisdom";

			update["cmb_ability"] = "strength";
			update["melee_ability"] = "strength";
			update["ranged_ability"] = "dexterity";
			update["cmd_mod"] = 10;

			update["speed_unit"] = "ft";
			update["speed_unit_long"] = "ft-lp",

			update["speed"] = 30;
			update["speed_race"] = 30;
			update["speed_base"] = 30;
			update["speed_character"] = 30;
			update["speed_encumbrance"] = 30;
			update["speed_armor"] = 30;
			update["speed_run_factor"] = 4;
			update["speed_run"] = 120;
			update["speed_swim"] = 7.5;
			update["speed_climb"] = 7.5;

			update["weight_unit"] = "lb"; // NEW

			update["encumbrance_load_light"] = 33;
			update["encumbrance_load_medium"] = 66;
			update["encumbrance_load_heavy"] = 100;
			update["encumbrance_lift_head"] = 100;
			update["encumbrance_lift_ground"] = 200;
			update["encumbrance_drag_push"] = 500;
			update["encumbrance_check_penalty"] = 0;
			update["encumbrance_ability_maximum"] = "-";
			update["encumbrance_run_factor"] = 4;
			update["encumbrance_coins_weight"] = 0;
			update["encumbrance_wealth_weight"] = 0; // NEW

			update["acrobatics_ability"] = "dexterity";
			update["appraise_ability"] = "intelligence";
			update["bluff_ability"] = "charisma";
			update["climb_ability"] = "strength";
			update["craft_ability"] = "intelligence";
			update["diplomacy_ability"] = "charisma";
			update["disable_device_ability"] = "dexterity";
			update["disguise_ability"] = "charisma";
			update["escape_artist_ability"] = "dexterity";
			update["fly_ability"] = "dexterity";
			update["handle_animal_ability"] = "charisma";
			update["heal_ability"] = "wisdom";
			update["intimidate_ability"] = "charisma";
			update["knowledge_arcana_ability"] = "intelligence";
			update["knowledge_dungeoneering_ability"] = "intelligence";
			update["knowledge_engineering_ability"] = "intelligence";
			update["knowledge_geography_ability"] = "intelligence";
			update["knowledge_history_ability"] = "intelligence";
			update["knowledge_local_ability"] = "intelligence";
			update["knowledge_nature_ability"] = "intelligence";
			update["knowledge_nobility_ability"] = "intelligence";
			update["knowledge_planes_ability"] = "intelligence";
			update["knowledge_religion_ability"] = "intelligence";
			update["linguistics_ability"] = "intelligence";
			update["perception_ability"] = "wisdom";
			update["perform_ability"] = "charisma";
			update["profession_ability"] = "wisdom";
			update["ride_ability"] = "dexterity";
			update["sense_motive_ability"] = "wisdom";
			update["sleight_of_hand_ability"] = "dexterity";
			update["spellcraft_ability"] = "intelligence";
			update["stealth_ability"] = "dexterity";
			update["survival_ability"] = "wisdom";
			update["swim_ability"] = "strength";
			update["use_magic_device_ability"] = "charisma";

			update["acrobatics_armor_penalty"] = "1";
			update["climb_armor_penalty"] = "1";
			update["disable_device_armor_penalty"] = "1";
			update["escape_artist_armor_penalty"] = "1";
			update["fly_armor_penalty"] = "1";
			update["ride_armor_penalty"] = "1";
			update["sleight_of_hand_armor_penalty"] = "1";
			update["stealth_armor_penalty"] = "1";
			update["swim_armor_penalty"] = "1";

			update["caster1_ability"] = "intelligence";
			update["caster2_ability"] = "intelligence";

			update["caster1_domains_schools_flag"] = "none";
			update["caster1_domains_schools"] = "none"; // TEMP
			update["caster2_domains_schools_flag"] = "none";
			update["caster2_domains_schools"] = "none"; // TEMP

			return update;
		};

		// === INITIALIZE
		const initialize_character = function(callback) {
			getAttrs(["character_name","npc"], (v) => {
				console.log("Initializing character " + v.character_name); // DEBUG
				if ((v["npc"] || "0") != "1") { // is PC
					setAttrs(calc_reset_character(), {silent: true}, () => {
						callback();
					});
				} else { // is NPC
					callback();
				}
			});
		};

		// === OPEN
		const sheet_open = function(eventinfo) {
			if (pfoglobals_initdone == 0) { // NOTE : once per session
				// Constructing array of repeating sections' attributes
				var obj = {};
				obj["section"] = "spell-like";
				obj["attrs"] = pfoglobals_spell_attr.concat(pfoglobals_spell_like_attr);
				pfoglobals_repsec_spell.push(obj);
				for (var i = 0; i < 10; i++) {
					obj = {};
					obj["section"] = "spell-" + i;
					obj["attrs"] = pfoglobals_spell_attr.concat(pfoglobals_spell_only_attr);
					pfoglobals_repsec_spell.push(obj);
				}
				// console.log("*** DEBUG pfoglobals_repsec_spell:" + JSON.stringify(pfoglobals_repsec_spell,null,"  "));
				// Query modifiers translation
				setAttrs({
					ask_modifier: getTranslationByKey("ask-modifier"),
					ask_atk_modifier: getTranslationByKey("ask-atk-modifier"),
					ask_dmg_modifier: getTranslationByKey("ask-dmg-modifier"),
					ask_whisper: getTranslationByKey("ask-whisper"),
					ask_public_roll: getTranslationByKey("ask-public-roll"),
					ask_whisper_roll: getTranslationByKey("ask-whisper-roll")},{silent: true},() => {
						pfoglobals_initdone = 1;
				});
			}
			// console.log("*** OPENED:" + JSON.stringify(eventinfo,null,"  "));
			if ((!eventinfo.sourceType) || (eventinfo.sourceType && eventinfo.sourceType != "sheetworker")) { // not NPC dropped from Compendium
				versioning();
			}
		};

// =============================================================================
// -----------------------------------------------------------------------------
// # Module : VERSIONS and UPDATES
// -----------------------------------------------------------------------------
// =============================================================================

		// === VERSIONS
		const check_l1_mancer = function() {
			getAttrs(["l1mancer_status","npc","charactermancer_step"], function(v) {
				// console.log("*** DEBUG check_l1_mancer: l1mancer_status = " + v.l1mancer_status + ", npc = " + v.npc + ", charactermancer_step = " + v.charactermancer_step);
				if (v.npc != "1") {
					if (v["l1mancer_status"] && v["l1mancer_status"] == "completed") {
						return;
					}
					if (v["charactermancer_step"]) {
						startCharactermancer(v["charactermancer_step"]);
					} else {
						if (v["l1mancer_status"] && v["l1mancer_status"] == "relaunch") {
							startCharactermancer("l1-welcome");
						} else {
							// setAttrs({"mancer_confirm_flag": 1}, {silent: true}); // EDIT
							setAttrs({"l1mancer_status" : "completed"}, {silent: true}); // Do NOT use Level 1 Charactermancer for new characters
						}
					}
				}
			});
		};

		const versioning = function() {
			getAttrs(["version", "build", "build_version", "initialize_character_flag"], (v) => {
				let vrs = parseFloat(v["version"]) || 0.0;
				let bldvrs = parseFloat(v["build_version"]) || "1.0";
				if (vrs === pfoglobals_currentversion) {
					if (!v["build"] || !v["build_version"]) {
						open_migrate_confirm(); // migrate from official
					} else {
						if (bldvrs !== pfoglobals_currentbuildversion || v["initialize_character_flag"] == 1) {
							setAttrs({"initialize_character_flag" : 0, ...pfoglobals_currentversion_obj}, {silent: true}); // update version
						}
						check_l1_mancer(); // check charactermancer (pursue or start)
						console.log("Pathfinder by Roll20 v" + vrs + " " + pfoglobals_currentbuild + " " + pfoglobals_currentbuildversion); // DEBUG
					}
				} else if (vrs < 1.0) {
					setAttrs({"initialize_character_flag": 1, ...pfoglobals_currentversion_obj}, {silent: true}, () => { // update version
						initialize_character(() => {
							versioning();
						});
					});
				} else if (vrs < 1.07) {
					update_to_1_07(() => {
						setAttrs({"version": "1.07"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.08) {
					update_to_1_08(() => {
						setAttrs({"version": "1.08"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.10) {
					update_to_1_10(() => {
						setAttrs({"version": "1.10"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.12) {
					update_to_1_12(() => {
						setAttrs({"version": "1.12"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.14) {
					update_to_1_14(() => {
						setAttrs({"version": "1.14"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.16) {
					update_to_1_16(() => {
						setAttrs({"version": "1.16"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.17) {
					update_to_1_17(() => {
						setAttrs({"version": "1.17"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.18) {
					update_to_1_18(() => {
						setAttrs({"version": "1.18"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.19) {
					update_to_1_19(() => {
						setAttrs({"version": "1.19"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.20) {
					update_to_1_20(() => {
						setAttrs({"version": "1.20"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.21) {
					update_to_1_21(() => {
						setAttrs({"version": "1.21"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.22) {
					update_to_1_22(() => {
						setAttrs({"version": "1.22"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.26) {
					update_to_1_26(() => {
						setAttrs({"version": "1.26"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.27) {
					update_to_1_27(() => {
						setAttrs({"version": "1.27"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.28) {
					update_to_1_28(() => {
						setAttrs({"version": "1.28"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.29) {
					update_to_1_29(() => {
						setAttrs({"version": "1.29"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.30) {
					update_to_1_30(() => {
						setAttrs({"version": "1.30"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.301) {
					update_to_1_301(() => {
						setAttrs({"version": "1.301"}, {silent: true}, () => {
							versioning();
						});
					});
				} else if (vrs < 1.302) {
					update_to_1_302(() => {
						setAttrs({"version": "1.302"}, {silent: true}, () => {
							versioning();
						});
					});
				} else {
					setAttrs({...pfoglobals_currentversion_obj}, {silent: true}, () => { // update version
						versioning();
					});
				}
			});
		};

		// === UPDATES
		const update_to_1_07 = function(doneupdating) {
			console.log("UPDATING TO v1.07");
			setAttrs({"ac_natural_bonus": 0,"ac_deflection_bonus":0,"ac_dodge_bonus":0},{silent: true},() => {
				doneupdating();
			});
		};
		const update_to_1_08 = function(doneupdating) {
			console.log("UPDATING TO v1.08");
			getAttrs(["ac_ability_mod","npc"], (v) => {
				if ((v["npc"] || "0") != "1") {
					var update = {};
					var mod = 0;
					if (v.ac_ability_mod) {
						mod = v.ac_ability_mod;
					}
					update["ac_ability_mod"] = mod;
					update["encumbrance_coins_weight"] = 0; // coin weight init
					setAttrs(update,{silent: true}, () => {
						update_ac(); // AC mod fix
						// Size mod fix
						update_babs_all();
						update_all_spells("all");
						// Coins weight
						update_coins_weight();
						update_gear_weight_total();
						update_encumbrance();
						doneupdating();
					});
				} else {
					doneupdating();
				}
			});
		};
		const update_to_1_10 = function(doneupdating) {
			console.log("UPDATING TO v1.10");
			getAttrs(["dexterity","hp","hp_max","npc"], (v) => {
				if ((v["npc"] || "0") != "1") {
					var update = {};
					var mod = Math.floor(((parseInt(v.dexterity) || 10) - 10) / 2);
					update["dexterity_half_mod"] = Math.floor(mod*0.5);
					update["dexterity_oneandahalf_mod"] = Math.floor(mod*1.5);
					update["hp_base"] = parseInt(v.hp) || 0;
					update["hp_base_max"] = parseInt(v.hp_max) || 0;
					setAttrs(update,{silent: true}, () => {
						update_cmd(); // Ability mod fix to CMD
						update_attacks("all"); // Conditions mod added to rolls
						update_all_spells("all"); // Conditions mod added to rolls
						doneupdating();
					});
				} else {
					doneupdating();
				}
			});
		};
		const update_to_1_12 = function(doneupdating) {
			console.log("UPDATING TO v1.12");
			getAttrs(["npc"], (v) => {
				if ((v["npc"] || "0") != "1") {
					update_all_skills(); // change armor/encumbrance penalty handling
				}
				doneupdating();
			});
		};
		const update_to_1_14 = function(doneupdating) {
			console.log("UPDATING TO v1.14");
			getAttrs(["npc","size"], (v) => {
				if ((v["npc"] || "0") != "1") {
					// size mods fix for CMB/CMD
					setAttrs(calc_pc_size(v["size"]),{silent: true}, () => {
						update_babs_all(); //=>attacks
					});
				}
				doneupdating();
			});
		};
		const update_to_1_16 = function(doneupdating) {
			console.log("UPDATING TO v1.16");
			getAttrs(["npc","class","race"], (v) => {
				if ((v["npc"] || "0") != "1") {
					update_speed();
					// Already existing PC to be considered complete regarding the Charactermancer
					if ((v.class && v.class.trim().length) || (v.race && v.race.trim().length)) {
						setAttrs({"l1mancer_status": "completed"}, {silent: true}, () => {
							doneupdating();
						});
					} else {
						doneupdating();
					}
				} else {
					doneupdating();
				}
			});
		};
		const update_to_1_17 = function(doneupdating) {
			console.log("UPDATING TO v1.17");
			getAttrs(["npc","class_favored","l1mancer_status"], (v) => {
				if ((v["npc"] || "0") != "1" && (v["l1mancer_status"] || "completed") == "completed") {
					let update = {};
					let fav = parseInt(v.class_favored) || 0;
					let i = 0;
					for (i = 1; i < 4; i++) {
						update["class" + i + "_favored"] = (fav == i) ? 1 : 0;
					}
					setAttrs(update, {silent: true}, () => {
						update_skillranks_total();
						doneupdating();
					});
				} else {
					doneupdating();
				}
			});
		};
		const update_to_1_18 = function(doneupdating) {
			console.log("UPDATING TO v1.18");
			getAttrs(["npc","l1mancer_status"], (v) => {
				if ((v["npc"] || "0") != "1" && (v["l1mancer_status"] || "completed") == "completed") {
					update_skillranks_total();
				}
				doneupdating();
			});
		};
		const update_to_1_19 = function(doneupdating) {
			console.log("UPDATING TO v1.19");
			getAttrs(["npc","l1mancer_status"], (v) => {
				if ((v["npc"] || "0") != "1" && (v["l1mancer_status"] || "completed") == "completed") {
					update_babs_all();
				}
				doneupdating();
			});
		};
		const update_to_1_20 = function(doneupdating) {
			console.log("UPDATING TO v1.20");
			getAttrs(["npc","l1mancer_status","ac_natural_bonus","ac_deflection_bonus","ac_dodge_bonus","ac_natural","ac_deflection","ac_dodge","hp_condition"], (v) => {
				if ((v["npc"] || "0") != "1" && (v["l1mancer_status"] || "completed") == "completed") {
					// Renaming some AC attributes for Buffs => recalculation
					var update = {"ac_armor_bonus": 0,"ac_shield_bonus": 0};
					if (v.ac_natural) {
						update["ac_natural_bonus"] = (parseInt(v.ac_natural) || 0);
						update["ac_natural"] = 0;
					}
					if (v.ac_deflection) {
						update["ac_deflection_bonus"] = (parseInt(v.ac_deflection) || 0);
						update["ac_deflection"] = 0;
					}
					if (v.ac_dodge) {
						update["ac_dodge_bonus"] = (parseInt(v.ac_dodge) || 0);
						update["ac_dodge"] = 0;
					}
					// New HP handling with buff bonus
					update["hp_mod"] = parseInt(v.hp_condition) || 0;
					update["hp_mod_flag"] = (parseInt(v.hp_condition) || 0) == 0 ? 0 : 1;
					setAttrs(update, {silent: true}, () => {
						update_ac_items(); // => ac_ability (=> ac (=> cmd)) / speed / skills / spells
						update_attacks("all");
						update_all_spells("all");
						doneupdating();
					});
				} else if (v.npc == "1") {
					update_all_spells("all");
					doneupdating();
				} else {
					doneupdating();
				}
			});
		};
		const update_to_1_21 = function(doneupdating) {
			console.log("UPDATING TO v1.21");
			getAttrs(["npc","l1mancer_status"], (v) => {
				if ((v["npc"] || "0") != "1" && (v["l1mancer_status"] || "completed") == "completed") {
					getSectionIDs("repeating_buff", (buffarray) => {
						getSectionIDs("repeating_abilities", (abltarray) => {
							getSectionIDs("repeating_spell-like", (splarray) => {
								let fields = [];
								if (buffarray.length) {
									fields = fields.concat(...buffarray.map((id) => `repeating_buff_${id}_mods`));
								}
								if (abltarray.length) {
									fields = fields.concat(...abltarray.map((id) => `repeating_abilities_${id}_perday_max`));
								}
								if (splarray.length) {
									fields = fields.concat(...splarray.map((id) => `repeating_spell-like_${id}_perday_max`));
								}
								fields.push("speed_climb","speed_swim");
								getAttrs(fields, (val) => {
									let update = {};
									// Handling new speed climb and swim bonuses
									update["speed_climb_base"] = val.speed_climb;
									update["speed_swim_base"] = val.speed_swim;
									// Change Buffs modifiers separator from comma to semi-columns (if not line-break)
									_.each(buffarray, (id) => {
										update[`repeating_buff_${id}_mods`] = val[`repeating_buff_${id}_mods`].replace(/\,/g,';');
									});
									// Change Per Day for PC Spell-like abilities and PC Traits from number to text (formula): _perday_max => _perday_qty
									_.each(abltarray, (id) => {
										update[`repeating_abilities_${id}_perday_qty`] = val[`repeating_abilities_${id}_perday_max`];
									});
									_.each(splarray, (id) => {
										update[`repeating_spell-like_${id}_perday_qty`] = val[`repeating_spell-like_${id}_perday_max`];
									});
									setAttrs(update, {silent: true},() => {
										update_speed();
										doneupdating();
									});
								});
							});
						});
					});
				} else {
					doneupdating();
				}
			});
		};
		const update_to_1_22 = function(doneupdating) {
			console.log("UPDATING TO v1.22");
			getAttrs(["npc","l1mancer_status"], (v) => {
				if ((v["npc"] || "0") != "1" && (v["l1mancer_status"] || "completed") == "completed") {
					recalculate("all",{},() => {
						doneupdating();
					});
				} else {
					doneupdating();
				}
			});
		};
		const update_to_1_26 = function(doneupdating) {
			console.log("UPDATING TO v1.26");
			getAttrs(["npc","l1mancer_status"], (v) => {
				if ((v["npc"] || "0") != "1" && (v["l1mancer_status"] || "completed") == "completed") {
					update_spells("like","all");
					doneupdating();
				} else {
					doneupdating();
				}
			});
		};
		const update_to_1_27 = function(doneupdating) {
			console.log("UPDATING TO v1.27");
			getAttrs(["rollmod_attack","rollmod_damage"], (v) => {
				update = {};
				if ("rollmod_attack" in v && v.rollmod_attack == "?{@{ask_modifier}|0}") {
					update["rollmod_attack"] = "?{@{ask_atk_modifier}|0}";
				}
				if ("rollmod_damage" in v && v.rollmod_damage == "?{@{ask_modifier}|0}") {
					update["rollmod_damage"] = "?{@{ask_dmg_modifier}|0}";
				}
				setAttrs(update, {silent: true}, () => {
					doneupdating();
				});
			});
		};
		const update_to_1_28 = function(doneupdating) {
			console.log("UPDATING TO v1.28");
			getAttrs(["npc","l1mancer_status"], (v) => {
				if ((v["npc"] || "0") != "1" && (v["l1mancer_status"] || "completed") == "completed") {
					update_attacks("all");
					doneupdating();
				} else {
					doneupdating();
				}
			});
		};
		const update_to_1_29 = function(doneupdating) {
			console.log("UPDATING TO v1.29");
			getAttrs(["npc","l1mancer_status"], (v) => {
				if ((v["npc"] || "0") != "1" && (v["l1mancer_status"] || "completed") == "completed") {
					getSectionIDs("repeating_acitems", (idarray) => {
						// Setting 0 max dex to "-"
						if (idarray.length) {
							let attrs = [];
							_.each(idarray, (itemid) => {
								attrs.push(`repeating_acitems_${itemid}_max_dex_bonus`);
							});
							getAttrs(attrs, (v) => {
								let update = {};
								_.each(idarray, (itemid) => {
									if (`repeating_acitems_${itemid}_max_dex_bonus` in v && v[`repeating_acitems_${itemid}_max_dex_bonus`] == "0") {
										update[`repeating_acitems_${itemid}_max_dex_bonus`] = "-";
									}
								});
								setAttrs(update,{silent: true}, () => {
									doneupdating();
								});
							});
						} else {
							doneupdating();
						}
					});
				} else {
					doneupdating();
				}
			});
		};
		const update_to_1_30 = function(doneupdating) {
			console.log("UPDATING TO v1.30");
			getAttrs(["npc","l1mancer_status","sr"], (v) => {
				if ((v["npc"] || "0") != "1" && (v["l1mancer_status"] || "completed") == "completed") {
					setAttrs({"sr_base":(v["sr"] || "0")}, {silent: true}, () => {
						update_damage_bonus_flag();
						doneupdating();
					});
				} else {
					doneupdating();
				}
			});
		};
		const update_to_1_301 = function(doneupdating) {
			console.log("UPDATING TO v1.301");
			getAttrs(["npc","l1mancer_status"], (v) => {
				if ((v["npc"] || "0") != "1" && (v["l1mancer_status"] || "completed") == "completed") {
					update_all_spells("all");
					doneupdating();
				} else {
					doneupdating();
				}
			});
		};
		const update_to_1_302 = function(doneupdating) {
			console.log("UPDATING TO v1.302");
			getAttrs(["npc","l1mancer_status"], (v) => {
				if ((v["npc"] || "0") != "1" && (v["l1mancer_status"] || "completed") == "completed") {
					update_attacks("all");
					doneupdating();
				} else {
					doneupdating();
				}
			});
		};

		// === MIGRATES
		const migrate_from_official = function() { // NEW
			console.info("=== BEGIN > MIGRATE FROM OFFICIAL ==="); // DEBUG
			let s = "=== END > MIGRATE FROM OFFICIAL ===";
			getAttrs(["npc", "background"], (v) => {
				let update = {...pfoglobals_currentversion_obj};
				if ((v["npc"] || "0") != "1") { // is PC
					get_repsec_ids([
						{section:"feats",attrs:["type"]},
						{section:"abilities",attrs:["type_choice"]},
						{section:"spell-like",attrs:["spellname", "spelltype"]}
					], (repsec_agr) => {
						let attrs = get_repsec_fields(repsec_agr), n, m;
						getAttrs(attrs, (w) => {
							for (n in w) {
								// -------------------------------------------------------------
								// * Fix feat type 'item creation' => 'item-creation'
								// -------------------------------------------------------------
								if (w[n] == "item creation") {
									console.log("Change feat type 'item creation' to 'item-creation' on " + n); // DEBUG
									update[n] = "item-creation";
								}
								// -------------------------------------------------------------
								// * Fix empty ability type (due to choice list addition)
								// -------------------------------------------------------------
								if (n.slice(-6) == "choice" && w[n] == "") {
									console.log("Found empty type choice for " + n + " ; set type to empty"); // DEBUG
									update[n.slice(0, -7)] = "";
								}
								// -------------------------------------------------------------
								// * Clear special ability type and reset name (due to choice list replacement)
								// -------------------------------------------------------------
								else if (n.slice(-9) == "spelltype" && w[n] != "") {
									console.log("Found non empty type for " + n + " ; clear string and reset name"); // DEBUG
									m = n.slice(0,-4) + "name";
									update[n] = "";
									update[m] = w[m];
								}
							}
							// ---------------------------------------------------------------
							// * Fix 'background' => 'misc_notes'
							// ---------------------------------------------------------------
							if (v["background"] && v["background"] != "") {
								console.log("Update 'misc_notes' from 'background'"); // DEBUG
								update["misc_notes"] = v["background"];
								update["background"] = "";
							}
							// ---------------------------------------------------------------
							// * Update attributes and Close migrate modal
							// ---------------------------------------------------------------
							setAttrs(update, {silent: true}, () => {
								recalculate("all", {"reset_speed_unit" : true}, () => { // reset speed unit
									close_migrate_confirm(s);
									versioning(); // for charmancer
								});
							});
						});
					});
				} else { // is NPC
					setAttrs(update, {silent: true}, () => {
						close_migrate_confirm(s);
						versioning(); // for charmancer
					});
				}
			});
		};

		return {
			migrate_from_official:migrate_from_official, // NEW
			close_migrate_confirm:close_migrate_confirm, // NEW
			calc_npc_skill_display: calc_npc_skill_display,
			check_l1_mancer: check_l1_mancer,
			pc_drop_handler: pc_drop_handler,
			drop_add_feats: drop_add_feats,
			drop_add_spellike: drop_add_spellike,
			drop_add_spells: drop_add_spells,
			pc_drop_spell: pc_drop_spell,
			recalculate: recalculate,
			mancer_finish: mancer_finish,
			reset_to_xpc: reset_to_xpc,
			sheet_open: sheet_open,
			update_ac: update_ac,
			update_ac_ability: update_ac_ability,
			update_ac_items: update_ac_items,
			update_all_skills: update_all_skills,
			update_all_spells: update_all_spells,
			update_attacks: update_attacks,
			update_traits: update_traits,
			update_babs: update_babs,
			update_babs_all: update_babs_all,
			update_class_names: update_class_names,
			update_class_numbers: update_class_numbers,
			update_cmd: update_cmd,
			update_coins_weight: update_coins_weight,
			update_wealth_weight: update_wealth_weight, // NEW
			update_concentration: update_concentration,
			update_default_token: update_default_token,
			update_encumbrance: update_encumbrance,
			update_gear_weight: update_gear_weight,
			update_gear_weight_total: update_gear_weight_total,
			update_gear_value:update_gear_value, // NEW
			switch_gear_usage:switch_gear_usage, // NEW
			get_total_values:get_total_values,
			update_hitdie: update_hitdie,
			update_initiative: update_initiative,
			update_mod: update_mod,
			update_npc_attack: update_npc_attack,
			update_npc_drop: update_npc_drop,
			update_save: update_save,
			update_size: update_size,
			update_skill: update_skill,
			update_skillranks_total: update_skillranks_total,
			update_skills_ranks: update_skills_ranks,
			update_speed: update_speed,
			update_spells: update_spells,
			update_spells_dc: update_spells_dc,
			update_spells_flag: update_spells_flag,
			update_spells_prepared: update_spells_prepared,
			update_spells_totals: update_spells_totals,
			update_sr: update_sr,
			update_damage_bonus_flag: update_damage_bonus_flag,
			update_special_ability_display: update_special_ability_display,
			update_speed_unit:update_speed_unit, // NEW
			update_weight_unit:update_weight_unit, // NEW
			update_ammo:update_ammo, // NEW
			update_mp:update_mp, // NEW
			update_spells_known:update_spells_known, // NEW
			update_spell_cost:update_spell_cost, // NEW
			update_spell_spend_mp_id:update_spell_spend_mp_id, // NEW
			update_all_spell_spend_mp:update_all_spell_spend_mp, // NEW
			update_all_domain_school:update_all_domain_school, // NEW
			switch_caster_level:switch_caster_level, // NEW
			parse_formula: parse_formula
		}

	})();

</script>
