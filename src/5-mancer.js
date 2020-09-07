<!-- MANCER WORKERS -->
<script type="text/worker">

	const mncrDebugMode = false;

	const mncrAbilities = ["strength","dexterity","constitution","intelligence","wisdom","charisma"];
	const mncrGetList = true;
	const mncrCostOfScore = {"7":"-4","8":"-2","9":"-1","10":"0","11":"1","12":"2","13":"3","14":"5","15":"7","16":"10","17":"13","18":"17"};
	const mncrDicepoolChoices = ["3","4","5","6","7","8", "9", "10", "11", "12", "13"];

	// === SPELL CHOOSE ===
	on("page:spell-choose", () => {
		getAttrs(["pcdrop_uniq","pcdrop_data","class1_name","caster1_flag","class2_name","caster2_flag"], (v) => {
			hideChoices();
			let update = {};
			let values = {};
			let showList = [];
			let cdata = (JSON.parse(v.pcdrop_data) || {});
			// Class handling: if we end up there, no class has been detected before (or both), so first valid caster class is selected
			if (((v.caster1_flag || "0") == "1") && ((v.caster2_flag || "0") == "1")) {
				values["spell_class"] = "1";
				showList.push("spell-class");
				update["class1-name"] = (v.class1_name || "");
				update["class2-name"] = (v.class2_name || "");
				update["choose-class"] = "" + getTranslationByKey("choose") + " " + getTranslationByKey("class") + ":";
			} else if ((v.caster2_flag || "0") == "1") {
				values["spell_class"] = "2";
			} else {
				values["spell_class"] = "1";
			}
			// Level handling: if we end up there, no class has been detected before (or both), so no level, so the first found level is used
			update["choose-level"] = "" + getTranslationByKey("choose") + " " + getTranslationByKey("level") + ":";
			values["spell_level"] = ((cdata["Level"] || "0").replace(/[^\d]+/g, "")).substr(0,1);
			setAttrs(values, () => {
				setCharmancerText(update);
				showChoices(showList);
				changeCompendiumPage("sheet-spells-info", v.pcdrop_uniq);
			});
		});
	});
	on("mancerchange:spell_level",(eventinfo) => {
		if (eventinfo.sourceType && eventinfo.sourceType == "player") {
			if (eventinfo.newValue && eventinfo.newValue == "like") {
				hideChoices(["spell-class"]);
			} else {
				getAttrs(["caster1_flag","caster2_flag"], (v) => {
					if (((v.caster1_flag || "0") == "1") && ((v.caster2_flag || "0") == "1")) {
						showChoices(["spell-class"]);
					}
				});
			}
		}
	});

	// === ABILITIES ===
	on("page:l1-abilities", () => {
		recalcData("abilities");
	});
	on("mancerchange:abilities", (eventinfo) => {
		let data = getCharmancerData();
		let initHide = ["abilities_possible"];
		let attribs = ["strength","dexterity","constitution","intelligence","wisdom","charisma"];
		let pointbuyChoices = ["7","8", "9", "10", "11", "12", "13", "14", "15","16","17","18"];
		let pointbuysPoints = {"purchase_low":10,"purchase_standard":15,"purchase_high":20,"purchase_epic":25};

		hideChoices(initHide);
		recalcData("abilities");

		if (["standard","classic","heroic"].includes(data["l1-abilities"].values.abilities)) {
			showChoices(["abilities_" + data["l1-abilities"].values.abilities]);
			if (data["l1-abilities"].values.roll_results && data["l1-abilities"].values.roll_results.length) {
				showChoices(["abilities_selects"]);
				var roll_results = typeof data["l1-abilities"].values.roll_results == "string" ? data["l1-abilities"].values.roll_results.split(",") : data["l1-abilities"].values.roll_results;
				_.each(attribs, (attrib) => {
					setCharmancerOptions(attrib, roll_results);
				});
			}
		}
		if (["purchase_low","purchase_standard","purchase_high","purchase_epic"].includes(eventinfo.newValue || "")) {
			setAttrs({"pointbuy_points": pointbuysPoints[eventinfo.newValue] || "15","max_pointbuy_points":pointbuysPoints[eventinfo.newValue] || "15"}, () => {
				showChoices(["abilities_pointbuy", "abilities_selects"]);
				setCharmancerText({"points_available_display":pointbuysPoints[eventinfo.newValue] || "15","max_points_available_display": pointbuysPoints[eventinfo.newValue] || "15"});
				_.each(attribs, (attrib) => {
					setCharmancerOptions(attrib, pointbuyChoices);
				});
			});
		}
		if (["purchase_low","dicepool_24","dicepool_28"].includes(eventinfo.newValue || "")) {
			var pool = eventinfo.newValue.slice(-2) || "24";
			setAttrs({"dicepool":pool,"max_dicepool":pool}, () => {
				showChoices(["abilities_dicepool"]);
				setCharmancerText({"dicepool_display":pool,"max_dicepool_display":pool});
				_.each(attribs, (attrib) => {
					setCharmancerOptions(attrib + "d6", mncrDicepoolChoices);
				});
			});
		}
		if (data["l1-abilities"].values.abilities == "custom") {
			showChoices(["abilities_custom"]);
		}

		reset = {};
		if (eventinfo.sourceType == "player") {
			_.each(attribs, (attrib) => {
				reset[attrib] = "";
			});
			reset["pointbuy_points"] = "15";
		}
		recalcData("abilities");
		setAttrs(reset);
	});
	on("mancerchange:strength mancerchange:dexterity mancerchange:constitution mancerchange:intelligence mancerchange:wisdom mancerchange:charisma", (eventinfo) => {
		let data = getCharmancerData();
		let attribs = ["strength","dexterity","constitution","intelligence","wisdom","charisma"];
		let clearvalues = [
			data["l1-abilities"].values.strength,
			data["l1-abilities"].values.dexterity,
			data["l1-abilities"].values.constitution,
			data["l1-abilities"].values.intelligence,
			data["l1-abilities"].values.wisdom,
			data["l1-abilities"].values.charisma];
		let purchases = ["purchase_low","purchase_standard","purchase_high","purchase_epic"];
		let clearvalue = eventinfo.newValue;

		if (!(data["l1-abilities"].values.abilities == "custom"
			 || purchases.includes(data["l1-abilities"].values.abilities))) {
			var clearObject = {};
			attribs = attribs.filter(item => item != eventinfo.triggerName);
			_.each(attribs, (attrib) => {
				if (clearvalue == data["l1-abilities"].values[attrib]) {
					clearObject[attrib] = "";
				}
			});
		}

		if (purchases.includes(data["l1-abilities"].values.abilities)) {
			recalcPoints();
		}

		if (eventinfo.sourceType == "player") {
			setAttrs(clearObject,{silent: true}, () => {
				recalcData("abilities");
			});
		} else {
			recalcData("abilities");
		}
	});
	on("mancerchange:strengthd6 mancerchange:dexterityd6 mancerchange:constitutiond6 mancerchange:intelligenced6 mancerchange:wisdomd6 mancerchange:charismad6", (eventinfo) => {
		data = getCharmancerData();
		let attribs = ["strengthd6","dexterityd6","constitutiond6","intelligenced6","wisdomd6","charismad6"];
		let maxPoints = parseInt(data["l1-abilities"].values["max_dicepool"]) || 0;
		let pointsAvailable = maxPoints;
		let scores = {};
		let button = "&{template:mancerroll} {{title=Ability Scores Rolls: Dice Pool}} {{r1=Not set}} {{r2=Not set}} {{r3=Not set}} {{r4=Not set}} {{r5=Not set}} {{r6=Not set}} {{r1name=^{strength}}} {{r2name=^{dexterity}}} {{r3name=^{constitution}}} {{r4name=^{intelligence}}} {{r5name=^{wisdom}}} {{r6name=^{charisma}}}";
		let i=1;

		// Decrement dice pool based on selected attribs
		_.each(attribs, (attrib) => {
			let dice = (parseInt(data["l1-abilities"].values[attrib]) || 0);
			pointsAvailable -= dice;
			if (dice > 0) {
				button = button.replace("{{r" + i + "=Not set}}","{{r"+i+"=[[" + dice + "d6kh3]]}}");
			}
			i++;
		});

		// Disable options if points are below a threshold.
		let choicesToDisable = [];
		_.each(mncrDicepoolChoices, (dice) => {
			if ((parseInt(dice) || -99) > pointsAvailable) {
				// console.log("*** DEBUG recalcPoints score / cost: " + score + " / " + cost);
				choicesToDisable.push(dice);
			}
		});
		// console.log("*** DEBUG recalcPoints choicesToDisable: " + choicesToDisable);
		if (choicesToDisable.length > 0) {
			_.each(attribs, (attrib) => {
				disableCharmancerOptions(attrib, choicesToDisable);
			});
		} else {
			_.each(attribs, (attrib) => {
				disableCharmancerOptions(attrib, []);
			});
		}

		setCharmancerText({"dicepool_display":String(pointsAvailable)});

		setAttrs({dicepool:String(pointsAvailable),"roll_rollstatsd6":button});
	});
	on("mancerroll:rollstats", (eventinfo) => {
		let attribs = ["strength","dexterity","constitution","intelligence","wisdom","charisma"];
		let results = [];
		let i = 1;
		// console.log("*** DEBUG mancerroll:rollstats: " + JSON.stringify(eventinfo,null,"  "));
		_.each(eventinfo.roll, (roll) => {
			results.push(roll.result + "~" + i);
			i++;
		});
		results.sort((a,b) => {return Number(a.split("~")[0]) - Number(b.split("~")[0])});
		_.each(attribs, (attrib) => {
			setCharmancerOptions(attrib, results);
		});
		setAttrs({roll_results: results, strength: "", dexterity: "", constitution: "", intelligence: "", wisdom: "", charisma: ""});
		showChoices(["abilities_selects"]);
	});
	on("mancerroll:rollstatsd6", (eventinfo) => {
		if (eventinfo.roll.length == 6) {
			let attribs = ["strength","dexterity","constitution","intelligence","wisdom","charisma"];
			let update = {};
			let i = 0;
			// console.log("*** DEBUG mancerroll:rollstatsd6: " + JSON.stringify(eventinfo,null,"  "));
			_.each(eventinfo.roll, (roll) => {
				update[attribs[i]] = roll.result;
				i++;
			});
			setAttrs(update, () => {
				recalcData("abilities");
			});
		}
	});
	on("clicked:clearstats", (eventinfo) => {
		let attribs = ["strength","dexterity","constitution","intelligence","wisdom","charisma","strengthd6","dexterityd6","constitutiond6","intelligenced6","wisdomd6","charismad6"];
		reset = {};
		_.each(attribs, (attrib) => {
			reset[attrib] = "";
			disableCharmancerOptions(attrib, []);
		});
		setAttrs(reset);
	});
	const handleAbilities = function(data, section) {
		let showList = [];
		if (data["data-Ability Score Choice"]) {
			showList.push(section + "_ability_choice1");
			if (data["data-Ability Score Choice"].split("+")[0] == "2") {
				showList.push(section + "_ability_choice2");
			}
		};
		return showList;
	};
	const recalcPoints = function() {
		data = getCharmancerData();
		let attribs = ["strength","dexterity","constitution","intelligence","wisdom","charisma"];
		let maxPoints = parseInt(data["l1-abilities"].values["max_pointbuy_points"]) || 0;
		let pointsAvailable = maxPoints;
		let scores = {};

		_.each(attribs, (attrib) => {
			scores[attrib] = (parseInt(data["l1-abilities"].values[attrib]) || 10);
		});

		// Decrement points based on selected attribs
		_.each(scores, (score) => {
			pointsAvailable -= (parseInt(mncrCostOfScore[score]) || 0);
		});

		// Disable options if points are below a threshold.
		let choicesToDisable = [];
		_.each(mncrCostOfScore, (cost, score) => {
			if ((parseInt(cost) || -99) > pointsAvailable) {
				// console.log("*** DEBUG recalcPoints score / cost: " + score + " / " + cost);
				choicesToDisable.push(score);
			}
		});
		// console.log("*** DEBUG recalcPoints choicesToDisable: " + choicesToDisable);
		if (choicesToDisable.length > 0) {
			_.each(attribs, (attrib) => {
				disableCharmancerOptions(attrib, choicesToDisable);
			});
		} else {
			_.each(attribs, (attrib) => {
				disableCharmancerOptions(attrib, []);
			});
		}

		setCharmancerText({"points_available_display":String(pointsAvailable)});

		setAttrs({pointbuy_points:String(pointsAvailable)});
	};

	// === RACE ===
	on("page:l1-race", () => {
		recalcData("race");
	});
	on("mancerchange:race", (eventinfo) => {
		hideChoices();

		let reset = {};
		if (!(eventinfo.newValue === "" || eventinfo.newValue === undefined)) {
			// showChoices(["race_options"]);
			changeCompendiumPage("sheet-race-info", eventinfo.newValue);
		} else {
			changeCompendiumPage("sheet-race-info", "Index:Races");
		}

		if (eventinfo.sourceType == "player") {
			//reset = {race_name: "", race_ability_choice1: "", race_skill_bonus_choice: "", race_feat_choice: "", race_custom_name: "", race_strength:0, race_dexterity: 0, race_constitution:0, race_intelligence:0, race_wisdom:0, race_charisma:0, race_custom_size: "medium", race_custom_speed:30};
			reset = {race_name: "", race_ability_choice1: "", race_skill_bonus_choice: "", race_feat_choice: "", race_custom_name: "", race_strength:0, race_dexterity: 0, race_constitution:0, race_intelligence:0, race_wisdom:0, race_charisma:0, race_custom_size: "medium", race_custom_speed:6}; // EDIT
		}

		if (eventinfo.newValue === "Index:Races") {
			//Clears saved data for this field
			getCompendiumPage("");
			setAttrs(reset, () => {
				let update = {"race_text": ""};
				showChoices(["custom_race"]);
				setCharmancerText(update);
				recalcData("race");
			});
		} else {
			getCompendiumPage(eventinfo.newValue, mncrGetList, (p) => {
				setAttrs(reset, () => {
					let mancerdata = getCharmancerData();
					let update = {};
					let showList = [];
					let possibles = ["race_ability_score", "race_size", "race_speed", "race_senses", "race_languages", "race_acnotes", "race_fortitude", "race_reflex", "race_will", "race_skill_bonus", "race_skill_bonus_choice", "race_feat_display", "race_spell_display", "race_traits"];
					let data = p["data"];
					let abilities_scores = calc_abilities(mancerdata);

					if (mncrDebugMode) {console.log("*** DEBUG race raw data:" + JSON.stringify(data,null,"  "));}

					if (!(eventinfo.newValue === "" || eventinfo.newValue === undefined)) {
						showList.push("race_always");
					}

					 _.each(possibles, (key) => {
						update[key] = "";
					});

					showList = showList.concat(handleAbilities(data, "race"));
					if (data["data-Ability Score Modifiers"]) {
						 update["race_ability_score"] = data["data-Ability Score Modifiers"];
					}
					if (data["data-Ability Score Choice"]) {
						update["race_ability_choice1_text"] = "+" + (data["data-Ability Score Choice"].split("+")[1] || "0") + " " + getTranslationByKey("to:");
					}

					if (data["data-Size"]) {update["race_size"] = data["data-Size"];};
					if (data["data-Race Speed"]) {
						update["race_speed"] = data["data-Race Speed"];
						if (data["data-Speed Not Modified"] && data["data-Speed Not Modified"] == "true") {
							update["race_speed"] += ", " + getTranslationByKey("speed-never-modified").toLowerCase();
						}
					};
					if (data["data-Senses"]) {
						update["race_senses"] = data["data-Senses"];
						showList.push("race_senses_row");
					};
					if (data["data-Languages"]) {
						update["race_languages"] = data["data-Languages"];
					};
					if (data["data-AC Notes"]) {
						update["race_acnotes"] = data["data-AC Notes"];
						showList.push("race_acnotes_row");
					};

					if (data["data-Fortitude Bonus"] || data["data-Fortitude Notes"]) {
						if (!showList["race_saves_row"]) {
							showList.push("race_saves_row");
						}
						showList.push("race_fortitude_row");
						update["race_fortitude"] = "";
						if (data["data-Fortitude Bonus"]) {
							update["race_fortitude"] += "+ " + data["data-Fortitude Bonus"];
						}
						if (data["data-Fortitude Notes"]) {
							update["race_fortitude"] += (update["race_fortitude"].length > 0 ? ", " : "") + data["data-Fortitude Notes"];
						}
					}
					if (data["data-Reflex Bonus"] || data["data-Reflex Notes"]) {
						if (!showList["race_saves_row"]) {
							showList.push("race_saves_row");
						}
						showList.push("race_reflex_row");
						update["race_reflex"] = "";
						if (data["data-Reflex Bonus"]) {
							update["race_reflex"] += "+ " + data["data-Reflex Bonus"];
						}
						if (data["data-Reflex Notes"]) {
							update["race_reflex"] += (update["race_reflex"].length > 0 ? ", " : "") + data["data-Reflex Notes"];
						}
					}
					if (data["data-Will Bonus"] || data["data-Will Notes"]) {
						if (!showList["race_saves_row"]) {
							showList.push("race_saves_row");
						}
						showList.push("race_will_row");
						update["race_will"] = "";
						if (data["data-Will Bonus"]) {
							update["race_will"] += "+ " + data["data-Will Bonus"];
						}
						if (data["data-Will Notes"]) {
							update["race_will"] += (update["race_will"].length > 0 ? ", " : "") + data["data-Will Notes"];
						}
					}

					if (data["data-Skills Bonus"] || data["data-Skills Bonus Choice"] || data["data-Skill Notes"]) {
						if (!showList["race_skills"]) {
							showList.push("race_skills");
						}
						var skl = "";
						if (data["data-Skills Bonus Choice"]) {
							var skillChoices = [];
							_.each(data["data-Skills Bonus Choice"].split(","), (achoice) => {
								if (achoice.trim().length > 0) {
									skillChoices.push(achoice.trim());
								}
							});
							if (skillChoices.length) {
								showList.push("race_skill_bonus_choice_row");
								setCharmancerOptions("race_skill_bonus_choice", skillChoices);
							}
						}
						if (data["data-Skills Bonus"]) {
							skl += " " + (data["data-Skills Bonus"] || "");
						}
						if (data["data-Skill Notes"]) {
							skl += " " + (data["data-Skill Notes"] || "");
						}
						// console.log("*** DEBUG race_skill_bonus :" + skl);
						if (skl.length > 0) {
							update["race_skill_bonus"] = skl.trim();
						}
					}

					if (data["data-Feats"]) {
						if (!showList["race_feats"]) {
							showList.push("race_feats");
						}
						if (data["data-Feats"] === "Any") {
							if (!showList["race_feat_choice_row"]) {
								showList.push("race_feat_choice_row");
							}
							setCharmancerOptions("race_feat_choice", "Category:Feats",{"category": "Feats"},() => {
								disableCharmancerOptions("race_feat_choice",get_feats(mancerdata));
							});
						} else {
							update["race_feat_display"] = data["data-Feats"];
						}
					}

					if (data["data-Spell-like abilities"]) {
						var spltxt = "";
						if (data["data-Spell-like abilities prerequisites"]) {
							var ablt = (data["data-Spell-like abilities prerequisites"].split(" ")[0] || "").trim().toLowerCase();
							var minv = parseInt((data["data-Spell-like abilities prerequisites"].split(" ")[1] || "").trim().toLowerCase()) || 99;
							// console.log(" *** DEBUG Spell-like: " + ablt + " >= " + minv);
							if ( (parseInt(abilities_scores[ablt].total) || 0) >= minv ) {
								spltxt = data["data-Spell-like abilities"];
							}
						} else {
							spltxt = data["data-Spell-like abilities"];
						}
						if (spltxt.length) {
							if (!showList["race_spells"]) {
								showList.push("race_spells");
							}
							update["race_spell_display"] = spltxt;
						}
					}

					if (data["data-Traits"]) {
						var traits_final = "";
						let tmp = data["data-Traits"].replace(/=&gt;/gi,":");
						var json = JSON.parse(tmp);
						_.each(json, (t, i) => {
							if (t["Name"] && t["Description"]) {
								traits_final = traits_final + "<b>" + t["Name"] + "</b> " + t["Description"];
								// + "<br>";
							};
						});
						if (traits_final.length) {
							showList.push("race_traits");
							update["race_traits"] = traits_final;
						}
					};

					setCharmancerText(update);
					showChoices(showList);
					recalcData("race");
				});
			});
		}
	});
	on("clicked:info_race", (eventinfo) => {
		let data = getCharmancerData();
		let race = data["l1-race"] && data["l1-race"].values.race ? data["l1-race"].values.race : "Index:Races";
		changeCompendiumPage("sheet-race-info", race);
	});
	on("mancerchange:race_ability_choice1", (eventinfo) => {
		if (eventinfo.sourceType == "player") {
			recalcData("race");
		}
	});
	on("mancerchange:race_strength mancerchange:race_dexterity mancerchange:race_constitution mancerchange:race_intelligence mancerchange:race_wisdom mancerchange:race_charisma", (eventinfo) => {
		if (eventinfo.sourceType == "player") {
			recalcData("race");
		}
	});
	on("mancerchange:race_feat_choice", (eventinfo) => {
		if (eventinfo.sourceType == "player") {
			if ((eventinfo.newValue || "").length) {
				changeCompendiumPage("sheet-race-info", eventinfo.newValue);
			}
		}
	});
	on("clicked:info_race_feat", (eventinfo) => {
		let data = getCharmancerData();
		if (data["l1-race"] && data["l1-race"].data && data["l1-race"].data.race && data["l1-race"].data.race["data-Feats"]) {
			if (data["l1-race"].data.race["data-Feats"] != "Any") {
				changeCompendiumPage("sheet-race-info", data["l1-race"].data.race["data-Feats"]);
				return;
			}
		}
		if (data["l1-race"] && data["l1-race"].values.race_feat_choice) {
			changeCompendiumPage("sheet-race-info", data["l1-race"].values.race_feat_choice); // ??? "Feats:" + data["l1-race"].values.race_feat_choice
			return;
		}
	});

	// === CLASS ===
	on("page:l1-class", () => {
		recalcData("class");
	});
	on("mancerchange:class", (eventinfo) => {
		hideChoices();
		recalcData("class");

		let reset = {};

		if (!(eventinfo.newValue === "" || eventinfo.newValue === undefined)) {
			// showChoices(["class_options"]);
			changeCompendiumPage("sheet-class-info", eventinfo.newValue);
		} else {
			changeCompendiumPage("sheet-class-info", "Rules:Classes");
		}

		if (eventinfo.sourceType == "player") {
			reset = {class_name: "", class_alignment_choice: "", class_wealth: "starting", class_gp: 0, class_feat_choice: "", class_subclass1: "", class_subclass2: ""};
			deleteCharmancerData(["l1-skills","l1-spells"], () => {
				update_class(eventinfo,reset);
			});
		} else {
			update_class(eventinfo,reset);
		}
	});
	on("clicked:info_class", (eventinfo) => {
		let data = getCharmancerData();
		let race = data["l1-class"] && data["l1-class"].values.class ? data["l1-class"].values.class : "Rules:Classes";
		changeCompendiumPage("sheet-class-info", race);
	});
	on("mancerchange:favored_class", (eventinfo) => {
		if (mncrDebugMode) {console.log("*** DEBUG mancerchange:favored_class:" + JSON.stringify(eventinfo,null,"  "));}
		recalcData("class-or-skills");
	});
	on("mancerchange:class_wealth", (eventinfo) => {
			console.log("*** DEBUG mancerchange:class_wealth: " + JSON.stringify(eventinfo,null,"  "));
			let mancerdata = getCharmancerData();
			let values = {};
			let update = {};
			let choices = ["class_wealthroll_display"];
			let gp = 0;
			if (eventinfo.newValue && eventinfo.newValue == "average") {
				hideChoices(choices);
				if (eventinfo.sourceType == "player") {
					values["class_gp"] = parseInt(mancerdata["l1-class"].data.class["data-Average Wealth"].toLowerCase().replace(/[^\d]/gi, "")) || 0;
				}
			} else if (eventinfo.newValue && eventinfo.newValue == "starting") {
				showChoices(choices);
				values["roll_rollwealth"] = "&{template:mancerroll} {{title=Wealth Roll}} {{r1=[["
										+ mancerdata["l1-class"].data.class["data-Starting Wealth"].toLowerCase().replace(/[^\d\sx×d]/gi, "").replace(/[x×]/gi, "*")
										+ "]]}} {{r1name=^{roll}}}";
				if (eventinfo.sourceType == "player") {
					values["class_gp"] = 0;
				} else {
					if (mancerdata["l1-class"].values.class_gp) {
						gp = mancerdata["l1-class"].values.class_gp;
					}
				}
				update["class_gp_display"] = gp + " gp";
			}
			setAttrs(values,{silent: true}, () => {
				setCharmancerText(update);
			});
	});
	on("mancerchange:class_feat_choice", (eventinfo) => {
		if (eventinfo.sourceType == "player") {
			if ((eventinfo.newValue || "").length) {
				changeCompendiumPage("sheet-class-info", eventinfo.newValue);
			}
		}
	});
	on("clicked:info_class_feat_choice", (eventinfo) => {
		let data = getCharmancerData();
		if (data["l1-class"] && data["l1-class"].values.class_feat_choice) {
			changeCompendiumPage("sheet-class-info", data["l1-class"].values.class_feat_choice);
		}
	});
	on("clicked:info_class_feat1 clicked:info_class_feat2 clicked:info_class_feat3 clicked:info_class_feat4", (eventinfo) => {
		// console.log("*** DEBUG clicked:info_class_featX: " + JSON.stringify(eventinfo,null,"  "));
		let data = getCharmancerData();
		if (data["l1-class"] && data["l1-class"].data && data["l1-class"].data.class && data["l1-class"].data.class["data-Bonus Feats"]) {
			var featz = data["l1-class"].data.class["data-Bonus Feats"];
			if (featz.indexOf(",") == -1) {
				changeCompendiumPage("sheet-class-info", "Feats:" + featz);
			} else {
				var tmpint = (parseInt(eventinfo["triggerName"].trim().slice(-1)) || 1)- 1;
				changeCompendiumPage("sheet-class-info", "Feats:" + featz.split(",")[tmpint].trim());
			}
		}
	});
	on("mancerroll:rollwealth", (eventinfo) => {
		// console.log("*** DEBUG mancerroll:rollwealth: " + JSON.stringify(eventinfo,null,"  "));
		let gp = parseInt((eventinfo.roll[0].result || "0"));
		setAttrs({class_gp: gp},{silent: true},() => {
			setCharmancerText({class_gp_display: gp + " gp"});
		});
	});
	on("mancerchange:class_subclass1 mancerchange:class_subclass2", (eventinfo) => {
		if ((eventinfo.newValue || "").length) {
			if (eventinfo.sourceType == "player") {
				changeCompendiumPage("sheet-class-info", eventinfo.newValue);
			}
		}
		update_subclasses(eventinfo.triggerName.slice(-1),eventinfo.newValue || "", eventinfo.sourceType || "");
	});
	on("clicked:info_subclass1", (eventinfo) => {
		let data = getCharmancerData();
		if (data["l1-class"] && data["l1-class"].values.class_subclass1) {
			changeCompendiumPage("sheet-class-info", data["l1-class"].values.class_subclass1);
		}
	});
	on("clicked:info_subclass2", (eventinfo) => {
		let data = getCharmancerData();
		if (data["l1-class"] && data["l1-class"].values.class_subclass2) {
			changeCompendiumPage("sheet-class-info", data["l1-class"].values.class_subclass2);
		}
	});
	on("mancerchange:class_subclass1_ability_choice", () => {
		recalcData("class");
	});
	on("clicked:info_subclass1_feat1 clicked:info_subclass1_feat2 clicked:info_subclass2_feat1 clicked:info_subclass2_feat2", (eventinfo) => {
		let data = getCharmancerData();
		let sub = eventinfo["triggerName"].charAt(21);
		if (data["l1-class"] && data["l1-class"].data && data["l1-class"].data["class_subclass" + sub] && data["l1-class"].data["class_subclass" + sub]["data-Bonus Feat"]) {
			var featz = data["l1-class"].data["class_subclass" + sub]["data-Bonus Feat"];
			if (featz.indexOf(",") == -1) {
				changeCompendiumPage("sheet-class-info", "Feats:" + featz);
			} else {
				var tmpint = (parseInt(eventinfo["triggerName"].trim().slice(-1)) || 1)- 1;
				changeCompendiumPage("sheet-class-info", "Feats:" + featz.split(",")[tmpint].trim());
			}
		}
	});
	const update_class = function(eventinfo,reset) {
		if (eventinfo.newValue === "Rules:Classes") {
			//Clears saved data for this field
			getCompendiumPage("");
			setAttrs(reset, () => {
				let update = {"class_text": ""};
				showChoices(["custom_class"]);
				setCharmancerText(update);
				recalcData("class");
			});
		} else {
			getCompendiumPage(eventinfo.newValue, mncrGetList, (p) => {
				setAttrs(reset,{silent: true}, () => {
					let mancerdata = getCharmancerData();
					let update = {};
					let showList = [];
					let possibles = ["class_alignment_display","class_traits","class_skill_bonus","class_speed_bonus","class_acsecondary","class_spellcasting_ability","class_spellcaster_level","class_spelllike","class_languages","class_feat1","class_feat2","class_feat3","class_feat4","class_subclass1_description","class_subclass2_description","class_gp_display"];
					let data = p["data"];
					let values = {};
					let tmpint = 0;

					if (mncrDebugMode) {console.log("*** DEBUG class raw data:" + JSON.stringify(data,null,"  "));}
					console.log("*** DEBUG class raw data:" + JSON.stringify(data,null,"  "));

					if (!(eventinfo.newValue === "" || eventinfo.newValue === undefined)) {
						showList.push("class_always");
					}

					_.each(possibles, (key) => {
						update[key] = "";
					});

					if (data["data-Hit Die"]) {
						update["class_hit_die"] = data["data-Hit Die"];
					}

					if (data["data-Alignment Choice"]) {
						var aligarray = [];
						_.each(data["data-Alignment Choice"].split(","), (el) => {
							if (el.trim().length > 0) {
								aligarray.push(el.trim());
							}
						});
						var options = {};
						if (aligarray.length == 1) {
							options["selected"] = data["data-Alignment Choice"].trim();
						}
						// console.log("*** DEBUG class alignment choices: " + aligarray);
						if (!showList["class_alignment_choice"]) {
							showList.push("class_alignment_choice");
						}
						setCharmancerOptions("class_alignment_choice",aligarray,options);
					}

					if (data["data-Class skills"]) {
						update["class_class_skills"] = data["data-Class skills"];
					}
					if (data["data-Skill Ranks"]) {
						update["class_skill_ranks"] = data["data-Skill Ranks"];
					}
					if (data["data-Skills bonus"]) {
						update["class_skill_bonus"] = data["data-Skills bonus"];
						showList.push("class_skill_bonus_row");
					}
					if (data["data-Starting Wealth"]) {
						update["class_wealth_starting"] = data["data-Starting Wealth"];
					}
					if (data["data-Average Wealth"]) {
						update["class_wealth_average"] = data["data-Average Wealth"];
					}
					if (mancerdata["l1-class"] && mancerdata["l1-class"].values.class_wealth) {
						if (mancerdata["l1-class"].values.class_wealth == "average") {
							update["class_gp_display"] = "";
						} else {
							values["class_wealth"] = "starting";
							showList.push("class_wealthroll_display");
							update["class_gp_display"] = (parseInt(mancerdata["l1-class"].values.class_gp) || 0) + " gp";
						}
					} else {
						if (data["data-Starting Wealth"]) {
							values["class_wealth"] = "starting";
						} else {
							values["class_wealth"] = "average";
						}
					}
					if (data["data-Base Attack Bonus"]) {
						tmpint = parseInt(data["data-Base Attack Bonus"]) || 0;
						update["class_bab"] = "" + (tmpint < 0 ? "" : "+") + tmpint;
					} else {
						update["class_bab"] = "+0";
					}
					if (data["data-Fortitude"]) {
						tmpint = parseInt(data["data-Fortitude"]) || 0;
						update["class_fortitude"] = "" + (tmpint < 0 ? "" : "+") + tmpint;
					} else {
						update["class_fortitude"] = "+0";
					}
					if (data["data-Reflex"]) {
						tmpint = parseInt(data["data-Reflex"]) || 0;
						update["class_reflex"] = "" + (tmpint < 0 ? "" : "+") + tmpint;
					} else {
						update["class_reflex"] = "+0";
					}
					if (data["data-Will"]) {
						tmpint = parseInt(data["data-Will"]) || 0;
						update["class_will"] = "" + (tmpint < 0 ? "" : "+") + tmpint;
					} else {
						update["class_will"] = "+0";
					}
					if (data["data-Speed bonus"]) {
						update["class_speed_bonus"] = data["data-Speed bonus"];
						showList.push("class_speed_bonus_row");
					}
					if (data["data-AC Seconday Ability"]) {
						update["class_acsecondary"] = data["data-AC Seconday Ability"];
						showList.push("class_acsecondary_row");
					}
					if (data["data-Spellcaster"]) {
						showList.push("class_spellcaster_row");
						update["class_spellcasting_ability"] = data["data-Spellcasting ability"];
						update["class_spellcaster_level"] = data["data-Spellcaster Level"];
					}
					if (data["data-Spell-like abilities"]) {
						update["class_spelllike"] = data["data-Spell-like abilities"];
						showList.push("class_spelllike_row");
					}
					if (data["data-Languages"]) {
						update["class_languages"] = data["data-Languages"];
						showList.push("class_languages_row");
					}
					if (data["data-Bonus Feats"] || data["data-Bonus Feats Choice"]) {
						showList.push("class_bonusfeats_row");
						if (data["data-Bonus Feats"]) {
							tmpint = 0;
							_.each(data["data-Bonus Feats"].split(","), (feat) => {
								tmpint++;
								showList.push("class_feat" + tmpint + "_row");
								update["class_feat" + tmpint] = feat.trim();
							});
						}
						if (data["data-Bonus Feats Choice"]) {
							let options = {"category": "Feats"};
							showList.push("class_feat_choice_row");
							if (data["data-Bonus Feats Choice"].indexOf(",") != -1) {
								var featquery = [];
								_.each(data["data-Bonus Feats Choice"].split(","), (feat) => {
									featquery.push(feat.trim());
								});
								setCharmancerOptions("class_feat_choice", featquery, options, () => {
									disableCharmancerOptions("class_feat_choice", get_feats(mancerdata));
								});
							} else {
								setCharmancerOptions("class_feat_choice", data["data-Bonus Feats Choice"], options, () => {
									disableCharmancerOptions("class_feat_choice", get_feats(mancerdata));
								});
							}
						}
					}
					if (data["data-Traits"]) {
						var traits_final = "";
						let tmp = data["data-Traits"].replace(/=&gt;/gi,":");
						var json = JSON.parse(tmp);
						_.each(json, (t, i) => {
							if (t["Name"]) {
								traits_final += "<b>" + t["Name"];
								if (t["Type"] || t["Per-day"]) {
									traits_final += " (";
									if (t["Type"]) {
										traits_final += t["Type"];
									}
									if (t["Per-day"]) {
										if (t["Type"]) {
											traits_final += ", ";
										}
										traits_final += t["Per-day"] + " " + getTranslationByKey("per-day");
									}
									traits_final += ")";
								}
								traits_final += "</b>";
								if (t["Description"]) {
									traits_final += " " + t["Description"];
								}
								// traits_final += "<br/>";
							};
						});
						update["class_traits"] = traits_final;
					};

					let class_name = eventinfo.newValue && eventinfo.newValue.split(":").length > 1 && eventinfo.newValue.split(":")[0] === "Classes" ? eventinfo.newValue.split(":")[1] : false;

					// Subclass
					// console.log("*** DEBUG mancerchange:class_subclass :" + choices);
					if (data["data-Subclass Number"] && data["data-Subclass Name"]) {
						if ((parseInt(data["data-Subclass Number"]) || 0) > 0) {
							// First subclass
							var subOptions = {show_source: true};
							if (eventinfo.sourceType != "player") {
								subOptions.silent = true;
							} else {
								subOptions.selected = "";
							}
							var choices = [];
							if (mancerdata["l1-class"].values["class_subclass1"]) {
								choices.push(mancerdata["l1-class"].values["class_subclass1"]);
							}
							if (mancerdata["l1-class"].values["class_subclass2"]) {
								choices.push(mancerdata["l1-class"].values["class_subclass2"]);
							}
							// Show subclass
							showList.push("subclass1_row");
							update["subclass1_name"] = data["data-Subclass Name"] + ":";
							setCharmancerOptions("class_subclass1","Category:Subclasses data-Parent:" + class_name, subOptions, () => {
								disableCharmancerOptions("class_subclass1", choices);
							});
							// 2nd subclass
							if ((parseInt(data["data-Subclass Number"]) || 0) > 1) {
								showList.push("subclass2_row");
								update["subclass2_name"] = data["data-Subclass Name"] + ":";
								setCharmancerOptions("class_subclass2","Category:Subclasses data-Parent:" + class_name, subOptions, () => {
									disableCharmancerOptions("class_subclass2", choices);
								});
							}
						}
					}
					console.log("*** DEBUG PRINT class chg:values: " + JSON.stringify(values,null,"  "));
					setAttrs(values, () => {
						setCharmancerText(update);
						showChoices(showList);
						recalcData("class");
					});
				});
			});
		}
	};
	const update_subclasses = function(nber, subclass, sourceType) {
		if (mncrDebugMode) {console.log("*** DEBUG subclass " + nber + " :" + subclass);}
		let update = {};
		let reset = {};
		let values = {};
		let showList = []; // "subclass1_detail","subclass2_detail"
		let hideList = ["subclass" + nber + "_detail","subclass" + nber + "_abltbonus_row","subclass" + nber + "_abltbonus_row","subclass" + nber + "_savebonus_row","subclass" + nber + "_speedbonus_row","subclass" + nber + "_classkills_row","class_subclass" + nber + "_classkills_choice","subclass" + nber + "_skillsbonus_row","subclass" + nber + "_bonusfeat_row","subclass" + nber + "_bonusfeat2_row","subclass" + nber + "_domainspell1_row","subclass" + nber + "_traits_row","subclass" + nber + "_powers_row"];
		let possibles = ["subclass" + nber + "_description","subclass" + nber + "_savebonus","subclass" + nber + "_speedbonus","subclass" + nber + "_classkills","subclass" + nber + "_skillsbonus","subclass" + nber + "_bonusfeat1","subclass" + nber + "_bonusfeat2","subclass" + nber + "_domainspell1","subclass" + nber + "_traits","subclass" + nber + "_powers"];

		_.each(possibles, (key) => {
			update[key] = "";
		});

		hideChoices(hideList);

		if (sourceType == "player" && (! subclass)) {
			reset["class_subclass" + nber + "_ability_choice"] = "";
			reset["class_subclass" + nber + "_classkills_choice"] = "";
		}

		getCompendiumPage(subclass, true, (dta) => {
			setAttrs(reset,{silent:true}, () => {
				let data = dta["data"];

				if (mncrDebugMode) {console.log("*** DEBUG suclass " + nber + " raw data:" + JSON.stringify(data,null,"  "));}

				showList.push("subclass" + nber + "_detail");

				if (data["data-Description"]) {
					update["subclass" + nber + "_description"] = data["data-Description"];
				}
				if (data["data-Ability bonus choice"]) {
					var abltarray = [];
					_.each(data["data-Ability bonus choice"].split(","), (el) => {
						if (el.trim().length > 0) {
							abltarray.push(el.trim());
						}
					});
					setCharmancerOptions("class_subclass" + nber + "_ability_choice",abltarray);
					showList.push("subclass" + nber + "_abltbonus_row");
				} else {
					values["class_subclass" + nber + "_ability_choice"] = "";
				}
				if (data["data-Saving Throws bonus"]) {
					showList.push("subclass" + nber + "_savebonus_row");
					update["subclass" + nber + "_savebonus"] = data["data-Saving Throws bonus"];
				}
				if (data["data-Base Speed Bonus"]) {
					showList.push("subclass" + nber + "_speedbonus_row");
					update["subclass" + nber + "_speedbonus"] = data["data-Base Speed Bonus"];
				}
				if (data["data-Initiative Bonus"]) {
					showList.push("subclass" + nber + "_initbonus_row");
					update["subclass" + nber + "_initbonus"] = data["data-Initiative Bonus"];
				}
				if (data["data-Class skills"]) {
					showList.push("subclass" + nber + "_classkills_row");
					if (data["data-Class skills"].toLowerCase().indexOf("any ") == -1) {
						update["subclass" + nber + "_classkills"] = data["data-Class skills"];
					} else {
						showList.push("class_subclass" + nber + "_classkills_choice");
					}
				} else {
					values["class_subclass" + nber + "_classkills_choice"] = "";
				}
				if (data["data-Skills bonus"]) {
					showList.push("subclass" + nber + "_skillsbonus_row");
					update["subclass" + nber + "_skillsbonus"] = data["data-Skills bonus"];
				}
				if (data["data-Bonus Feat"]) {
					showList.push("subclass" + nber + "_bonusfeat_row");
					update["subclass" + nber + "_bonusfeat1"] = data["data-Bonus Feat"].split(",")[0];
					if (data["data-Bonus Feat"].split(",").length > 1) {
						update["subclass" + nber + "_bonusfeat2"] = data["data-Bonus Feat"].split(",")[1];
						showList.push("subclass" + nber + "_bonusfeat2_row");
					}
				}
				if (data["data-Domain Spells Level 1"]) {
					showList.push("subclass" + nber + "_domainspell1_row");
					update["subclass" + nber + "_domainspell1"] = data["data-Domain Spells Level 1"];
				}

				// Traits
				if (data["data-Traits"]) {
					var traits_final = "";
					let tmp = data["data-Traits"].replace(/=&gt;/gi,":");
					var json = JSON.parse(tmp);
					_.each(json, (t, i) => {
						if (t["Name"]) {
							traits_final += "<b>" + t["Name"];
							if (t["Type"]) {
								traits_final += " (" + t["Type"] + ")";
							}
							traits_final += "</b>";
							if (t["Description"]) {
								traits_final += " " + t["Description"];
							}
							// traits_final += "<br/>";
						};
					});
					if (traits_final.length) {
						showList.push("subclass" + nber + "_traits_row");
						update["subclass" + nber + "_traits"] = traits_final;
					}
				};

				// Powers
				if (data["data-Powers"]) {
					var powers_final = "";
					let tmp = data["data-Powers"].replace(/=&gt;/gi,":");
					var json = JSON.parse(tmp);
					_.each(json, (t, i) => {
						if (t["Name"]) {
							powers_final += "<b>" + t["Name"];
							if (t["Type"] || t["Per-day"]) {
								powers_final += " (";
								if (t["Type"]) {
									powers_final += t["Type"];
								}
								if (t["Per-day"]) {
									if (t["Type"]) {
										powers_final += ", ";
									}
									powers_final += t["Per-day"] + " " + getTranslationByKey("per-day");
								}
								powers_final += ")";
							}
							powers_final += "</b>";
							if (t["Description"]) {
								powers_final += " " + t["Description"];
							}
							// powers_final += "<br/>";
						};
					});
					if (powers_final.length) {
						showList.push("subclass" + nber + "_powers_row");
						update["subclass" + nber + "_powers"] = powers_final;
					}
				};
				setAttrs(values, () => {
					showChoices(showList);
					setCharmancerText(update);
					recalcData();
				});
			});
		});
	};

	// === SKILLS ===
	on("page:l1-skills", () => {
		recalcData("skills");
	});
	on("mancerchange:acrobatics_ranks mancerchange:appraise_ranks mancerchange:bluff_ranks mancerchange:climb_ranks mancerchange:craft_ranks mancerchange:diplomacy_ranks mancerchange:disable_device_ranks mancerchange:disguise_ranks mancerchange:escape_artist_ranks mancerchange:fly_ranks mancerchange:handle_animal_ranks mancerchange:heal_ranks mancerchange:intimidate_ranks mancerchange:knowledge_arcana_ranks mancerchange:knowledge_dungeoneering_ranks mancerchange:knowledge_engineering_ranks mancerchange:knowledge_geography_ranks mancerchange:knowledge_history_ranks mancerchange:knowledge_local_ranks mancerchange:knowledge_nature_ranks mancerchange:knowledge_nobility_ranks mancerchange:knowledge_planes_ranks mancerchange:knowledge_religion_ranks mancerchange:linguistics_ranks mancerchange:perception_ranks mancerchange:perform_ranks mancerchange:profession_ranks mancerchange:ride_ranks mancerchange:sense_motive_ranks mancerchange:sleight_of_hand_ranks mancerchange:spellcraft_ranks mancerchange:stealth_ranks mancerchange:survival_ranks mancerchange:swim_ranks mancerchange:use_magic_device_ranks", () => {
		recalcData("skills");
	});
	on("clicked:clearskillranks", (eventinfo) => {
		update = {};
		_.each(["acrobatics","appraise","bluff","climb","craft","diplomacy","disable_device","disguise","escape_artist","fly","handle_animal","heal","intimidate","knowledge_arcana","knowledge_dungeoneering","knowledge_engineering","knowledge_geography","knowledge_history","knowledge_local","knowledge_nature","knowledge_nobility","knowledge_planes","knowledge_religion","linguistics","perception","perform","profession","ride","sense_motive","sleight_of_hand","spellcraft","stealth","survival","swim","use_magic_device"], (skill) => {
				update[skill + "_ranks"] = 0;
		});
		setAttrs(update,{silent: true},() => {
			recalcData("skills");
		});
	});

	// === FEATS ===
	on("page: page:l1-feats", () => {
		hideChoices();

		let update = {};
		let showList = ["feat_lvl1_1"];
		let data = getCharmancerData();

		// Race
		if (data["l1-race"]) {
			if (data["l1-race"].values.race_feat_choice) {
				showList.push("race_feats");
				update["race_feat_display"] = data["l1-race"].values.race_feat_choice.replace("Feats:","");
			} else if (data["l1-race"].data && data["l1-race"].data.race && data["l1-race"].data.race["data-Feats"] && data["l1-race"].data.race["data-Feats"] != "Any") {
				showList.push("race_feats");
				update["race_feat_display"] = data["l1-race"].data.race["data-Feats"];
			}
		}

		// Class
		if (data["l1-class"]) {
			if (data["l1-class"].values.class_feat_choice) {
				showList.push("class_bonusfeats_row","class_feat_choice_row");
				update["class_feat_choice_display"] = data["l1-class"].values.class_feat_choice.replace("Feats:","");
			}
			if (data["l1-class"].data && data["l1-class"].data.class && data["l1-class"].data.class["data-Bonus Feats"]) {
				showList.push("class_bonusfeats_row");
				if (data["l1-class"].data.class["data-Bonus Feats"]) {
					tmpint = 0;
					_.each(data["l1-class"].data.class["data-Bonus Feats"].split(","), (feat) => {
						tmpint++;
						showList.push("class_feat" + tmpint + "_row");
						update["class_feat" + tmpint] = feat.trim();
					});
				}
			}
			// Subclass 1
			if (data["l1-class"].values.class_subclass1) {
				if (data["l1-class"].data && data["l1-class"].data.class_subclass1 && data["l1-class"].data.class_subclass1["data-Bonus Feat"]) {
					showList.push("subclass_feats_row","subclass1_bonusfeat_row");
					update["subclass1_name"] = data["l1-class"].values.class_subclass1.replace("Subclasses:","");
					update["subclass1_bonusfeat1"] = data["l1-class"].data.class_subclass1["data-Bonus Feat"].split(",")[0].trim();
					if (data["l1-class"].data.class_subclass1["data-Bonus Feat"].split(",").length > 1) {
						update["subclass1_bonusfeat2"] = data["l1-class"].data.class_subclass1["data-Bonus Feat"].split(",")[1].trim();
						showList.push("subclass1_bonusfeat2_row");
					}
				}
			}
			// Subclass 2
			if (data["l1-class"].values.class_subclass2) {
				if (data["l1-class"].data && data["l1-class"].data.class_subclass2 && data["l1-class"].data.class_subclass2["data-Bonus Feat"]) {
					showList.push("subclass_feats_row","subclass2_bonusfeat_row");
					update["subclass2_name"] = data["l1-class"].values.class_subclass2.replace("Subclasses:","");
					update["subclass2_bonusfeat1"] = data["l1-class"].data.class_subclass2["data-Bonus Feat"].split(",")[0].trim();
					if (data["l1-class"].data.class_subclass2["data-Bonus Feat"].split(",").length > 1) {
						update["subclass2_bonusfeat2"] = data["l1-class"].data.class_subclass2["data-Bonus Feat"].split(",")[1].trim();
						showList.push("subclass2_bonusfeat2_row");
					}
				}
			}
		}
		setCharmancerOptions("feat_lvl1_1", "Category:Feats", {}, () => {
			disableCharmancerOptions("feat_lvl1_1", get_feats(data));
			setCharmancerText(update);
			showChoices(showList);
			recalcData("feats");
		});
	});
	on("mancerchange:feat_lvl1_1", (eventinfo) => {
		if (eventinfo.newValue && eventinfo.sourceType == "player") {
			changeCompendiumPage("sheet-feats-info", eventinfo.newValue);
		}
	});
	on("clicked:info_feat_lvl1_1", (eventinfo) => {
		let data = getCharmancerData();
		if (data["l1-feats"].values["feat_lvl1_1"]) {
			changeCompendiumPage("sheet-feats-info", data["l1-feats"].values["feat_lvl1_1"]);
		}
	});

	// === SPELLS ===
	on("page:l1-spells", () => {
		let update = {};
		let showList = [];
		let values = {};
		let spellreset = {"spells_level_0_1":"","spells_level_0_2":"","spells_level_0_3":"","spells_level_0_4":"","spells_level_0_5":"","spells_level_0_6":"","spells_level_1_1":"","spells_level_1_2":"","spells_level_1_3":"","spells_level_1_4":"","spells_level_1_5":"","spells_level_1_6":"","spells_level_1_7":"","spells_level_1_8":"","spells_level_1_9":""};
		let data = getCharmancerData();

		hideChoices();

		if (data["l1-class"] && data["l1-class"].values.class) {
			if (data["l1-class"].data && data["l1-class"].data.class
			&& data["l1-class"].data.class["data-Spellcaster"]
			&& (data["l1-class"].data.class["data-Spells Per Day"] || data["l1-class"].data.class["data-Spells Known"])) {

				// Reset of spells if class has changed
				if (data["l1-spells"] && data["l1-spells"].values["spellcaster"]) {
					if (data["l1-spells"].values.spellcaster != data["l1-class"].values.class) {
						values["spellcaster"] = data["l1-class"].values.class;
						_.extend(values,spellreset);
					}
				} else {
					values["spellcaster"] = data["l1-class"].values.class;
				}

				// Abilities mods
				var abilities_scores = calc_abilities(data);
				var ability_mods = calc_abilities_mod(abilities_scores);

				// Check ability
				var ablt = 10;
				var ablt_name = getTranslationByKey("intelligence");
				if (data["l1-class"].data.class["data-Spellcasting ability"]) {
					ablt = parseInt(abilities_scores[data["l1-class"].data.class["data-Spellcasting ability"].toLowerCase()].total) || 10;
					ablt_name = getTranslationByKey(data["l1-class"].data.class["data-Spellcasting ability"].toLowerCase());
				}
				if (ablt < 10 ) {
					_.extend(values,spellreset);
					update["spells_nospell"] = data["l1-class"].values.class.replace("Classes:","") + " "
									+ getTranslationByKey("cant-cast-with")
									+ " " + ablt + " " + ablt_name;
				} else {
					// Bonus spells
						/* ablt < 10 : Can’t cast spells tied to this ability
						ablt > 9 && ablt < 12 : 0 bonus spells
						ablt > 11 && ablt < 20 : 1 bonus spells
						ablt > 19 : 2 bonus spells */
					var bonuspells = [0,0];
					if (ablt > 11 && ablt < 20) {
						bonuspells[1] = 1;
					} else if (ablt > 19) {
						bonuspells[1] = 2;
					}

					// Spells known/per day
					showList.push("spells_spells");
					var lvlarr;
					var prepared = false;
					if (data["l1-class"].data.class["data-Spells Known"]) {
						lvlarr = data["l1-class"].data.class["data-Spells Known"].split(",");
						update["spells_nospell"] = getTranslationByKey("choose-known-spells");
					} else {
						prepared = true;
						lvlarr = data["l1-class"].data.class["data-Spells Per Day"].split(",");
						update["spells_nospell"] = getTranslationByKey("choose-prepared-spells");
					}

					var querry = "";
					if (data["l1-class"].data.class["data-Spell Choice"]) {
						querry = data["l1-class"].data.class["data-Spell Choice"];
					} else {
						querry = "Category:Spells";
					}

					// Domain spells
					for (var j = 1; j < 3; j++) {
						if (data["l1-class"].values["class_subclass" + j]
						&& data["l1-class"].data["class_subclass" + j]
						&& data["l1-class"].data["class_subclass" + j]["data-Domain Spells Level 1"]) {
							showList.push("spells_domainspell" + j + "_row");
							update["spells_domain" + j] = getTranslationByKey("domaine-spell") + " (" + data["l1-class"].values["class_subclass" + j].replace("Subclasses:","") + "):";
							update["spells_domainspell" + j] = data["l1-class"].data["class_subclass" + j]["data-Domain Spells Level 1"];
						}
					}

					// Spell choices
					var spelllevel = -1;
					_.each(lvlarr, (lvl) => {
						spelllevel++;
						var nbspells = 0;
						if (lvl.indexOf("+") == -1) {
							nbspells = parseInt(lvl) || 0;
						} else {
							nbspells = (parseInt(lvl.split("+")[0].toLowerCase().trim()) || 0) + (parseInt(ability_mods[lvl.split("+")[1].toLowerCase().trim()]) || 0);
						}
						// Adding bonus spells for prepared spells (not spells known)
						if (prepared) {
							nbspells += (bonuspells[spelllevel] || 0);
						}
						if (nbspells) {
							showList.push("spells_level_" + spelllevel);
							for (var i = 1; i < 10; i++) {
								if (i <= nbspells) {
									showList.push("spells_level_" + spelllevel + "_" + i + "_row");
									setCharmancerOptions("spells_level_" + spelllevel + "_" + i, querry.replace("CASTERLEVEL",spelllevel));
								} else {
									values["spells_level_" + spelllevel + "_" + i] = "";
								}
							}
						}
					});
				}
			} else {
				values["spellcaster"] = "";
				_.extend(values,spellreset);
				update["spells_nospell"] = getTranslationByKey("character-no-spells");
			}
		} else {
			values["spellcaster"] = "";
			_.extend(values,spellreset);
			update["spells_nospell"] = getTranslationByKey("character-no-spells");
		}
		setAttrs(values,{silent: true},() => {
			if (! _.isEmpty(update)) {
				setCharmancerText(update);
			}
			showChoices(showList);
			recalcData("spells");
		});
	});
	on("mancerchange:spells_level_0_1 mancerchange:spells_level_0_2 mancerchange:spells_level_0_3 mancerchange:spells_level_0_4 mancerchange:spells_level_0_5 mancerchange:spells_level_0_6 mancerchange:spells_level_1_1 mancerchange:spells_level_1_2 mancerchange:spells_level_1_3 mancerchange:spells_level_1_4 mancerchange:spells_level_1_5 mancerchange:spells_level_1_6", (eventinfo) => {

		if (eventinfo.newValue && eventinfo.sourceType == "player") {
			changeCompendiumPage("sheet-spells-info", eventinfo.newValue);
		}

		let data = getCharmancerData();
		// Selected spells to disable
		let choices = [];
		let i = 0;
		let j = 0;
		for (j = 0; j < 2; j++) {
			for (i = 1; i < 10; i++) {
				if (data["l1-spells"].values["spells_level_" + j + "_" + i]) {
					choices.push(data["l1-spells"].values["spells_level_" + j + "_" + i]);
				}
			}
		}

		// Domain spells
		for (j = 1; j < 3; j++) {
			if (data["l1-class"] && data["l1-class"].values["class_subclass" + j]
			&& data["l1-class"].data["class_subclass" + j]
			&& data["l1-class"].data["class_subclass" + j]["data-Domain Spells Level 1"]) {
				choices.push("Spells:" + data["l1-class"].data["class_subclass" + j]["data-Domain Spells Level 1"]);
			}
		}

		// console.log("*** DEBUG change:spells_level_x_y choices: " + choices);

		// Disable spells
		for (j = 0; j < 2; j++) {
			for (i = 1; i < 10; i++) {
				disableCharmancerOptions("spells_level_" + j + "_" + i,choices);
			}
		}
	});
	on("clicked:spells_level_0_1 clicked:spells_level_0_2 clicked:spells_level_0_3 clicked:spells_level_0_4 clicked:spells_level_1_1 clicked:spells_level_1_2 clicked:spells_level_1_3 clicked:spells_level_1_4 clicked:spells_level_1_5 clicked:spells_level_1_6 clicked:spells_level_1_7 clicked:spells_level_1_8 clicked:spells_level_1_9", (eventinfo) => {
		// "triggerName": "clicked:spells_level_0_1"
		let spell = eventinfo["triggerName"].replace("clicked:","");
		let data = getCharmancerData();
		if (data["l1-spells"].values[spell]) {
			changeCompendiumPage("sheet-spells-info", data["l1-spells"].values[spell]);
		}
	});
	on("clicked:spells_domainspell1 clicked:spells_domainspell2", (eventinfo) => {
		let j = eventinfo["triggerName"].slice(-1);
		let data = getCharmancerData();
		if (data["l1-class"] && data["l1-class"].data
			&& data["l1-class"].data["class_subclass" + j]
			&& data["l1-class"].data["class_subclass" + j]["data-Domain Spells Level 1"]) {
			changeCompendiumPage("sheet-spells-info", "Spells:" + data["l1-class"].data["class_subclass" + j]["data-Domain Spells Level 1"]);
		}
	});

	// === SUMMARY ===
	on("page:l1-summary", () => {
		let returnObj = recalcData("summary") || {};

		hideChoices();
		let update = {};
		let values = {};
		let showList = [];
		let nogo = false;
		let data = getCharmancerData();

		_.each(["abilities","race","class","skills","feats","feats"],(cat) => {
			_.each(["_req","_err","_"], (lab) => {
				update["sum" + lab + "_" + cat] = "";
			});
		});

		// === ABILITIES ===
		if (data["l1-abilities"] && data["l1-abilities"].values
			&& data["l1-abilities"].values["abilities"]
			&& data["l1-abilities"].values["strength"]
			&& data["l1-abilities"].values["dexterity"]
			&& data["l1-abilities"].values["constitution"]
			&& data["l1-abilities"].values["intelligence"]
			&& data["l1-abilities"].values["wisdom"]
			&& data["l1-abilities"].values["charisma"]) {
				showList.push("sum_abilities");
				let method = "";
				if (data["l1-abilities"].values["abilities"] == "custom") {
					method = getTranslationByKey("custom");
				} else {
					method = getTranslationByKey("rollab-" + data["l1-abilities"].values["abilities"]);
				}
				update["sum_abilities"] = "You have generated your Ability Scores using the <b>" + method + "</b> method.";
		} else {
			nogo = true;
			showList.push("sum_req_abilities");
			update["sum_req_abilities"] = "You need to generate your Ability Scores."
				+ ' <span data-i18n="return-to:">Return to:</span> <div class="sheet-step sheet-next"><button class="sheet-step" type="back" value="l1-abilities" data-i18n="abilities">Abilities</button></div>';
		}

		// === RACE ===
		if (data["l1-race"] && data["l1-race"].values.race) {
			showList.push("sum_race");
			if (data["l1-race"].values.race == "Index:Races") {
				update["sum_race"] = "Your Custom Race is <b>" + (data["l1-race"].values["race_custom_name"] || "Unknown") + "</b>.";
			} else {
				update["sum_race"] = "Your Race is <b>" + data["l1-race"].values.race.replace("Races:","") + "</b>.";
			}
			if (data["l1-race"].data && data["l1-race"].data.race) {
				// race_ability_choice1
				if (data["l1-race"].data.race["data-Ability Score Choice"] && (! data["l1-race"].values["race_ability_choice1"])) {
					nogo = true;
					showList.push("sum_req_race");
					update["sum_req_race"] = (update["sum_req_race"].length > 0 ? " " : "") + "You haven't picked an Ability Score Increase.";
				}
				// race_skill_bonus_choice
				if (data["l1-race"].data.race["data-Skills Bonus Choice"] && (! data["l1-race"].values["race_skill_bonus_choice"])) {
					nogo = true;
					showList.push("sum_req_race");
					update["sum_req_race"] = (update["sum_req_race"].length > 0 ? " " : "") + "You haven't picked a Skill Bonus.";
				}
				// race_feat_choice
				if (data["l1-race"].data.race["data-Feats"] && data["l1-race"].data.race["data-Feats"] == "Any" && (! data["l1-race"].values["race_feat_choice"])) {
					nogo = true;
					showList.push("sum_req_race");
					update["sum_req_race"] = (update["sum_req_race"].length > 0 ? " " : "") + "You haven't picked a Bonus Feat.";
				}
				if (update["sum_req_race"] && (update["sum_req_race"].length > 0)) {
					update["sum_req_race"] += ' <span data-i18n="return-to:">Return to:</span> <div class="sheet-step sheet-next"><button class="sheet-step" type="back" value="l1-race" data-i18n="race">Race</button></div>';
				}
			}
		} else {
			nogo = true;
			showList.push("sum_req_race");
			update["sum_req_race"] = "You need to pick a Race." + ' <span data-i18n="return-to:">Return to:</span> <div class="sheet-step sheet-next"><button class="sheet-step" type="back" value="l1-race" data-i18n="race">Race</button></div>';
		}

		// === CLASS ===
		if (data["l1-class"] && data["l1-class"].values.class) {
			showList.push("sum_class");
			if (data["l1-class"].values.class == "Rules:Classes") {
				update["sum_class"] = "You choose to set a custom Class.";
			} else {
				update["sum_class"] = "Your Class is <b>" + data["l1-class"].values.class.replace("Classes:","") + "</b>.";
				// Alignment
				if (! data["l1-class"].values.class_alignment_choice) {
					showList.push("sum_err_class");
					update["sum_err_class"] += (update["sum_err_class"].length > 0 ? " " : "") + "Your haven't chosen your alignment.";
				}
				// Wealth
				if (data["l1-class"].values["class_wealth"]
					&& data["l1-class"].values["class_wealth"] == "starting"
					&& ((! data["l1-class"].values["class_gp"]) || (data["l1-class"].values["class_gp"] && data["l1-class"].values["class_gp"] == "0"))) {
					showList.push("sum_err_class");
					update["sum_err_class"] += (update["sum_err_class"].length > 0 ? " " : "") + "Your haven't roll your Starting Wealth.";
				}
				if (data["l1-class"].data && data["l1-class"].data.class) {
					// Subclasses
					if (data["l1-class"].data.class["data-Subclass Name"]) {
						if (data["l1-class"].values.class_subclass1) {
							update["sum_class"] += " Your <b>" + data["l1-class"].data.class["data-Subclass Name"] + "</b> is <b>" + data["l1-class"].values.class_subclass1.replace("Subclasses:","") + "</b>.";
							if (data["l1-class"].data.class_subclass1) {
								// Ability Choice
								if (data["l1-class"].data.class_subclass1["data-Ability bonus choice"]
									&& (! data["l1-class"].values["class_subclass1_ability_choice"])) {
										nogo = true;
										showList.push("sum_req_class");
										update["sum_req_class"] += (update["sum_req_class"].length > 0 ? " " : "") + "Your need to pick an Ability Score Increase.";
								}
								// Subclass Skill Choice
								if (data["l1-class"].data.class_subclass1["data-Class skills"]
									&& (data["l1-class"].data.class_subclass1["data-Class skills"].indexOf("Any") != -1)
									&& (! data["l1-class"].values["class_subclass1_classkills_choice"])) {
										nogo = true;
										showList.push("sum_req_class");
										update["sum_req_class"] += (update["sum_req_class"].length > 0 ? " " : "") + "Your need to pick a Class Skill.";
								}
							}
						} else {
							nogo = true;
							showList.push("sum_req_class");
							update["sum_req_class"] += (update["sum_req_class"].length > 0 ? " " : "") + "Your need to pick a " + data["l1-class"].data.class["data-Subclass Name"] + ".";
						}
						if (data["l1-class"].values.class_subclass2) {
							update["sum_class"] += " Your <b>second " + data["l1-class"].data.class["data-Subclass Name"] + "</b> is <b>" + data["l1-class"].values.class_subclass2.replace("Subclasses:","") + "</b>.";
							if (data["l1-class"].data.class_subclass2) {
								// Ability Choice
								if (data["l1-class"].data.class_subclass2["data-Ability bonus choice"]
									&& (! data["l1-class"].values["class_subclass2_ability_choice"])) {
										nogo = true;
										showList.push("sum_req_class");
										update["sum_req_class"] += (update["sum_req_class"].length > 0 ? " " : "") + "Your need to pick an Ability Score Increase.";
								}
								// Subclass Skill Choice
								if (data["l1-class"].data.class_subclass2["data-Class skills"]
									&& (data["l1-class"].data.class_subclass2["data-Class skills"].indexOf("Any") != -1)
									&& (! data["l1-class"].values["class_subclass2_classkills_choice"])) {
										nogo = true;
										showList.push("sum_req_class");
										update["sum_req_class"] += (update["sum_req_class"].length > 0 ? " " : "") + "Your need to pick a Class Skill.";
								}
							}
						} else if (data["l1-class"].data.class["data-Subclass Number"] == "2") {
							nogo = true;
							showList.push("sum_req_class");
							update["sum_req_class"] += (update["sum_req_class"].length > 0 ? " " : "") + "Your need to pick a second " + data["l1-class"].data.class["data-Subclass Name"] + ".";
						}
					}
					// Feat Choice
					if (data["l1-class"].data.class["data-Bonus Feats Choice"]
						&& (! data["l1-class"].values["class_feat_choice"])) {
						nogo = true;
						showList.push("sum_req_class");
						update["sum_req_class"] += (update["sum_req_class"].length > 0 ? " " : "") + "Your need to pick a Bonus Feat.";
					}
				}
				if (update["sum_req_class"] && (update["sum_req_class"].length > 0)) {
					update["sum_req_class"] += ' <span data-i18n="return-to:">Return to:</span> <div class="sheet-step sheet-next"><button class="sheet-step" type="back" value="l1-class" data-i18n="class">Class</button></div>';
				}
			}
		} else {
			nogo = true;
			showList.push("sum_req_class");
			update["sum_req_class"] = "Your need to pick a Class."
				+ ' <span data-i18n="return-to:">Return to:</span> <div class="sheet-step sheet-next"><button class="sheet-step" type="back" value="l1-class" data-i18n="class">Class</button></div>';
		}

		// === SKILLS ===
		if (data["l1-class"] && data["l1-class"].values.class) {
			if (data["l1-skills"] && data["l1-skills"].values) {
				var listskill = "";
				_.each(Object.keys(data["l1-skills"].values),(skl) => {
					if (skl.indexOf("_ranks") > -1) {
						if ((parseInt(data["l1-skills"].values[skl]) || 0) > 0) {
							listskill += (listskill.length > 0 ? ", " : "") + getTranslationByKey(skl.replace("_ranks",""));
						}
					}
				});
				if (listskill.length) {
					showList.push("sum_skills");
					update["sum_skills"] = "You picked the following Skills: <b>" + listskill + "</b>.";
					if (! _.isEmpty(returnObj) && returnObj.skillranks) {
						if ((parseInt(returnObj.skillranks.current) || 0) > 0) {
							nogo = true;
							showList.push("sum_req_skills");
							update["sum_req_skills"] = "You haven't spent all of your Skill Ranks."
								+ ' <span data-i18n="return-to:">Return to:</span> <div class="sheet-step sheet-next"><button class="sheet-step" type="back" value="l1-skills" data-i18n="skills">Skills</button></div>';
						} else if ((parseInt(returnObj.skillranks.current) || 0) < 0) {
							showList.push("sum_err_skills");
							update["sum_err_skills"] = "You have spent more than your Skill Ranks."
								+ ' <span data-i18n="return-to:">Return to:</span> <div class="sheet-step sheet-next"><button class="sheet-step" type="back" value="l1-skills" data-i18n="skills">Skills</button></div>';
						}
					}
				} else {
					nogo = true;
					showList.push("sum_req_skills");
					update["sum_req_skills"] = "You have not picked any Skill."
						+ ' <span data-i18n="return-to:">Return to:</span> <div class="sheet-step sheet-next"><button class="sheet-step" type="back" value="l1-skills" data-i18n="skills">Skills</button></div>';
				}
			} else {
				nogo = true;
				showList.push("sum_req_skills");
				update["sum_req_skills"] = "You have not picked any Skill."
					+ ' <span data-i18n="return-to:">Return to:</span> <div class="sheet-step sheet-next"><button class="sheet-step" type="back" value="l1-skills" data-i18n="skills">Skills</button></div>';
			}
		} else {
			showList.push("sum_err_skills");
			update["sum_err_skills"] = "Your need to pick a Class."
		}

		// === FEATS ===
		if (data["l1-feats"] && data["l1-feats"].values["feat_lvl1_1"]) {
			showList.push("sum_feats");
			update["sum_feats"] = "You have picked <b>" + data["l1-feats"].values["feat_lvl1_1"].replace("Feats:","") + "</b>.";
		} else {
			nogo = true;
			showList.push("sum_req_feats");
			update["sum_req_feats"] = "You need to pick a Feat."
				+ ' <span data-i18n="return-to:">Return to:</span> <div class="sheet-step sheet-next"><button class="sheet-step" type="back" value="l1-feats" data-i18n="feats">Feats</button></div>';
		}

		// === SPELLS ===
		if (data["l1-class"] && data["l1-class"].values.class) {
			if (data["l1-class"].data && data["l1-class"].data.class
			&& data["l1-class"].data.class["data-Spellcaster"]
			&& (data["l1-class"].data.class["data-Spells Per Day"] || data["l1-class"].data.class["data-Spells Known"])) {
				if (data["l1-spells"] && data["l1-spells"].values) {
					// Abilities mods
					var abilities_scores = calc_abilities(data);
					var ability_mods = calc_abilities_mod(abilities_scores);

					// Check ability
					var ablt = 10;
					var ablt_name = getTranslationByKey("intelligence");
					if (data["l1-class"].data.class["data-Spellcasting ability"]) {
						ablt = parseInt(abilities_scores[data["l1-class"].data.class["data-Spellcasting ability"].toLowerCase()].total) || 10;
						ablt_name = getTranslationByKey(data["l1-class"].data.class["data-Spellcasting ability"].toLowerCase());
					}
					if (ablt < 10 ) {
						showList.push("sum_err_spells");
						update["sum_err_spells"] = data["l1-class"].values.class.replace("Classes:","") + " "
						+ getTranslationByKey("cant-cast-with")
						+ " " + ablt + " " + ablt_name;
					} else {
						// Bonus spells
							/* ablt < 10 : Can’t cast spells tied to this ability
							ablt > 9 && ablt < 12 : 0 bonus spells
							ablt > 11 && ablt < 20 : 1 bonus spells
							ablt > 19 : 2 bonus spells */
						var bonuspells = [0,0];
						if (ablt > 11 && ablt < 20) {
							bonuspells[1] = 1;
						} else if (ablt > 19) {
							bonuspells[1] = 2;
						}

						// Spells known/per day
						var lvlarr;
						var prepared = false;
						if (data["l1-class"].data.class["data-Spells Known"]) {
							lvlarr = data["l1-class"].data.class["data-Spells Known"].split(",");
						} else {
							prepared = true;
							lvlarr = data["l1-class"].data.class["data-Spells Per Day"].split(",");
						}

						// Spell choices
						var spellschosen = "";
						var allspellschosen = true;
						var spelllevel = -1;
						_.each(lvlarr, (lvl) => {
							spelllevel++;
							var nbspells = 0;
							if (lvl.indexOf("+") == -1) {
								nbspells = parseInt(lvl) || 0;
							} else {
								nbspells = (parseInt(lvl.split("+")[0].toLowerCase().trim()) || 0) + (parseInt(ability_mods[lvl.split("+")[1].toLowerCase().trim()]) || 0);
							}
							// Adding bonus spells for prepared spells (not spells known)
							if (prepared) {
								nbspells += (bonuspells[spelllevel] || 0);
							}
							if (nbspells) {
								let i = 0;
								for (i = 1; i < 10; i++) {
									if (i <= nbspells) {
										if (data["l1-spells"].values["spells_level_" + spelllevel + "_" + i]) {
											spellschosen += (spellschosen.length > 0 ? ", " : "") + data["l1-spells"].values["spells_level_" + spelllevel + "_" + i].replace("Spells:","");
										} else {
											allspellschosen = false;
										}
									}
								}
							}
							if (spellschosen.length) {
								showList.push("sum_spells");
								update["sum_spells"] = "You have selected the following Spells: <b>" + spellschosen + "</b>.";
								if (! allspellschosen) {
									nogo = true;
									showList.push("sum_req_spells");
									update["sum_req_spells"] = "Your haven't picked all your Spells."
										+ ' <span data-i18n="return-to:">Return to:</span> <div class="sheet-step sheet-next"><button class="sheet-step" type="back" value="l1-spells" data-i18n="spells">Spells</button></div>';
								}
							} else {
								nogo = true;
								showList.push("sum_req_spells");
								update["sum_req_spells"] = "Your haven't picked any Spells."
									+ ' <span data-i18n="return-to:">Return to:</span> <div class="sheet-step sheet-next"><button class="sheet-step" type="back" value="l1-spells" data-i18n="spells">Spells</button></div>';
							}
						});
					}
				} else {
					nogo = true;
					showList.push("sum_req_spells");
					update["sum_req_spells"] = "Your haven't picked any Spells."
						+ ' <span data-i18n="return-to:">Return to:</span> <div class="sheet-step sheet-next"><button class="sheet-step" type="back" value="l1-spells" data-i18n="spells">Spells</button></div>';
				}
			} else {
				showList.push("sum_spells");
				update["sum_spells"] = getTranslationByKey("character-no-spells");
			}
		} else {
			showList.push("sum_err_spells");
			update["sum_err_spells"] = "Your need to pick a Class."
		}

		// === Final phrase on top ===
		if (nogo) {
			showList.push("sum_req_sum");
			update["sum_req_sum"] = "You have missed some required fields";
			values["mancer_apply"] = "0";
		} else {
			showList.push("sum_sum");
			update["sum_sum"] = "If you are ready to build your character, click <b>APPLY</b>.";
			values["mancer_apply"] = "1";
		}
		setAttrs(values,{silent: true}, () => {
			setCharmancerText(update);
			showChoices(showList);
		});
	});

	// === GENERAL FUNCTIONS
	const get_feats = function(data) {
		// -- Feat already gained or selected
		let choices = [];

		// Race
		if (data["l1-race"]) {
			if (data["l1-race"].values.race_feat_choice) {
				choices.push(format_compendium_category("Feats",data["l1-race"].values.race_feat_choice));
			} else if (data["l1-race"].data && data["l1-race"].data.race && data["l1-race"].data.race["data-Feats"] && data["l1-race"].data.race["data-Feats"] != "Any") {
				_.each(data["l1-race"].data.race["data-Feats"].split(","), (feat) => {
					choices.push(format_compendium_category("Feats",feat.trim()));
				});
			}
		}

		// Class
		if (data["l1-class"]) {
			if (data["l1-class"].values.class_feat_choice) {
				choices.push(format_compendium_category("Feats",data["l1-class"].values.class_feat_choice));
			}
			if (data["l1-class"].data && data["l1-class"].data.class && data["l1-class"].data.class["data-Bonus Feats"]) {
				_.each(data["l1-class"].data.class["data-Bonus Feats"].split(","), (feat) => {
					choices.push(format_compendium_category("Feats",feat.trim()));
				});
			}
			if (data["l1-class"].values.class_subclass1
				&& data["l1-class"].data && data["l1-class"].data.class_subclass1 && data["l1-class"].data.class_subclass1["data-Bonus Feat"]) {
				_.each(data["l1-class"].data.class_subclass1["data-Bonus Feat"].split(","), (feat) => {
					choices.push(format_compendium_category("Feats",feat.trim()));
				});
			}
			if (data["l1-class"].values.class_subclass2
				&& data["l1-class"].data && data["l1-class"].data.class_subclass2 && data["l1-class"].data.class_subclass2["data-Bonus Feat"]) {
				_.each(data["l1-class"].data.class_subclass2["data-Bonus Feat"].split(","), (feat) => {
					choices.push(format_compendium_category("Feats",feat.trim()));
				});
			}
		}

		// Level 1 Feat
		if (data["l1-feats"] && data["l1-feats"].values["feat_lvl1_1"]) {
			choices.push(format_compendium_category("Feats",data["l1-feats"].values["feat_lvl1_1"]));
		}

		if (mncrDebugMode) {console.log("*** DEBUG get_feats: " + choices);}
		return choices;
	};

	const format_compendium_category = function(category,value) {
		return (value.indexOf(category + ":") == -1 ? (category + ":") : "") + value.trim();
	};

	const calc_abilities = function(data) {
		let abilities_scores = {};
		// --- Preparing ability scores detailed array
		_.each(mncrAbilities, (ability) => {
			abilities_scores[ability] = {"total": 0, "base":"0","race":"0","class":"0","subclass":"0","misc":"0"};
		});
		// --- Abilities base
		if (data["l1-abilities"]) {
			_.each(mncrAbilities, function(ability) {
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
						var abrace = modifier.trim().toLowerCase();
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
			if (data["l1-race"].values["race"] == "Index:Races") {
				//Custom race abilities bonuses
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
		// Final abilities calculation
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

	const recalcData = function(currentStep = "") {
		let data = getCharmancerData();
		let update = {};
		let returnObj = {};

		if (mncrDebugMode) {console.log("*** DEBUG recalcData before:" + JSON.stringify(data,null,"  "));}

		// === ABILITIES SCORES ===
		let abilities_scores = calc_abilities(data);
		// Abilities mods
		let ability_mods = calc_abilities_mod(abilities_scores);
		_.each(mncrAbilities, (ability) => {
			if (abilities_scores[ability].total != 0) {
				update[ability + "_total"] = "" + abilities_scores[ability].total + " / "
											 + (ability_mods[ability] > 0 ? "+" : "") + ability_mods[ability];
			} else {
				update[ability + "_total"] = "-";
			}
		});
		if (mncrDebugMode) {console.log("*** DEBUG recalcData abilities_scores: " + JSON.stringify(abilities_scores,null,"  "));}

		// === SAVES ===
		let saves_array = [{"name": "fortitude","ability": "constitution"},{"name": "reflex","ability": "dexterity"},{"name": "will","ability": "wisdom"}];
		let saves_scores = {};
		// --- Preparing saves detailed array
		_.each(saves_array, (save) => {
			saves_scores[save.name] = {"total":0,"base":0,"race":0,"class":0,"subclass":0,"misc":0, "ability": save.ability};
		});
		// --- Abilities bonus
		if (data["l1-abilities"]) {
			_.each(saves_array, (save) => {
				saves_scores[save.name].base = ability_mods[save.ability];
			});
		}
		// --- Saves race
		if (data["l1-race"] && data["l1-race"].data && data["l1-race"].data.race) {
			_.each(saves_array, (save) => {
				if (data["l1-race"].data.race["data-" + save.name.charAt(0).toUpperCase() + save.name.slice(1) + " Bonus"]) {
					saves_scores[save.name].race = (parseInt(data["l1-race"].data.race["data-" + save.name.charAt(0).toUpperCase() + save.name.slice(1) + " Bonus"]) || 0);
				}
			});
		}
		// --- Saves class
		if (data["l1-class"] && data["l1-class"].data && data["l1-class"].data.class) {
			if (data["l1-class"].data.class["data-Fortitude"]) {
				saves_scores["fortitude"].class = parseInt(data["l1-class"].data.class["data-Fortitude"]) || 0;
			}
			if (data["l1-class"].data.class["data-Reflex"]) {
				saves_scores["reflex"].class = parseInt(data["l1-class"].data.class["data-Reflex"]) || 0;
			}
			if (data["l1-class"].data.class["data-Will"]) {
				saves_scores["will"].class = parseInt(data["l1-class"].data.class["data-Will"]) || 0;
			}
		}
		// --- Saves subclass
		let subclsvbonus = 0;
		if (data["l1-class"] && data["l1-class"].values.class_subclass1) {
			if (data["l1-class"] && data["l1-class"].data && data["l1-class"].data.class_subclass1 && data["l1-class"].data.class_subclass1["data-Saving Throws bonus"]) {
				subclsvbonus = parseInt(data["l1-class"].data.class_subclass1["data-Saving Throws bonus"].replace(/[^\d\-]/gi, "")) || 0;
				_.each(saves_array, (save) => {
					saves_scores[save.name].subclass = parseInt(saves_scores[save.name].subclass) + subclsvbonus;
				});
			}
		}
		if (data["l1-class"] && data["l1-class"].values.class_subclass2) {
			if (data["l1-class"] && data["l1-class"].data && data["l1-class"].data.class_subclass2 && data["l1-class"].data.class_subclass2["data-Saving Throws bonus"]) {
				subclsvbonus = parseInt(data["l1-class"].data.class_subclass2["data-Saving Throws bonus"].replace(/[^\d\-]/gi, "")) || 0;
				_.each(saves_array, (save) => {
					saves_scores[save.name].subclass = parseInt(saves_scores[save.name].subclass) + subclsvbonus;
				});
			}
		}
		// --- Saves misc
		// Final Saves calculation
		_.each(saves_array, (save) => {
			saves_scores[save.name].total = (parseInt(saves_scores[save.name].base) || 0) + (parseInt(saves_scores[save.name].race) || 0) + (parseInt(saves_scores[save.name].class) || 0) + (parseInt(saves_scores[save.name].subclass) || 0) + (parseInt(saves_scores[save.name].misc) || 0);
			if (saves_scores[save.name].total != 0) {
				update[save.name + "_total"] = saves_scores[save.name].total;
			} else {
				update[save.name + "_total"] = "-";
			}
		});
		if (mncrDebugMode) {console.log("*** DEBUG recalcData saves_score: " + JSON.stringify(saves_scores,null,"  "));}

		// === HIT POINTS ===
		let hp = parseInt(ability_mods["constitution"]) || 0;
		if (data["l1-class"] && data["l1-class"].data && data["l1-class"].data.class && data["l1-class"].data.class["data-Hit Die"]) {
			hp += (parseInt(String(data["l1-class"].data.class["data-Hit Die"]).replace("d","")) || 0);
			if (data["l1-class"].values.favored_class && data["l1-class"].values.favored_class == "2") {
				hp += 1;
			}
		}
		update["hit_points"] = hp > 0 ? hp : "-";

		// === Skill ranks ===
		let ranks = {"current":0,"max":0};
		if (["class","skills","summary","class-or-skills"].includes(currentStep)) {
			var rankablt = "intelligence";
			var rankbase = 0;
			var rankbonus = 0;
			var rankrace = 0;
			// Max ranks
			if (data["l1-class"] && data["l1-class"].data && data["l1-class"].data.class && data["l1-class"].data.class["data-Skill Ranks"]) {
				if (data["l1-class"].data.class["data-Skill Ranks"].indexOf("+") != -1) {
					rankbase = (parseInt(data["l1-class"].data.class["data-Skill Ranks"].split("+")[0]) || 0);
					rankablt = data["l1-class"].data.class["data-Skill Ranks"].split("+")[1];
					if (rankablt.length) {
						rankablt = rankablt.toLowerCase().replace(" modifier","").trim();
					}
				}
			}
			rankbonus = ability_mods[rankablt];
			if (data["l1-race"] && data["l1-race"].data && data["l1-race"].data.race && data["l1-race"].data.race["data-Skill Ranks Bonus"]) {
				rankrace = parseInt(data["l1-race"].data.race["data-Skill Ranks Bonus"].replace(/[^\d\-]/gi, "")) || 0;
			}
			ranks.max = (rankbase + rankbonus + rankrace) < 1 ? 1 : (rankbase + rankbonus + rankrace);
			if (data["l1-class"] && data["l1-class"].values && data["l1-class"].values.favored_class && data["l1-class"].values.favored_class == "1") {
				ranks.max += 1;
			}

			// Current ranks
			var rankstotal = 0;
			_.each(["acrobatics","appraise","bluff","climb","craft","diplomacy","disable_device","disguise","escape_artist","fly","handle_animal","heal","intimidate","knowledge_arcana","knowledge_dungeoneering","knowledge_engineering","knowledge_geography","knowledge_history","knowledge_local","knowledge_nature","knowledge_nobility","knowledge_planes","knowledge_religion","linguistics","perception","perform","profession","ride","sense_motive","sleight_of_hand","spellcraft","stealth","survival","swim","use_magic_device"], (skill) => {
				if (data["l1-skills"] && data["l1-skills"].values[skill + "_ranks"]) {
					rankstotal += (parseInt(data["l1-skills"].values[skill + "_ranks"]) || 0);
					ranks[skill] = 1;
				} else {
					ranks[skill] = 0;
				}
			});
			if (rankstotal) {
				ranks.current = (parseInt(ranks.max) || 0) - rankstotal;
			} else {
				ranks.current = ranks.max;
			}

			if (currentStep == "class") {
				update["class_skill_ranks_total"] = "(" + ranks.max + ")";
			}

			if (currentStep == "summary") {
				returnObj["skillranks"] = ranks;
			}
		}

		// === SKILLS ===
		if (["skills","class-or-skills"].includes(currentStep)) {
			// === Ranks
			if (! _.isEmpty(ranks)) {
				update["skills_ranks_current"] = ranks.current;
				update["skills_ranks_max"] = ranks.max;
			}
			// === Class skills
			var skillclass = {"acrobatics":0,"appraise":0,"bluff":0,"climb":0,"craft":0,"diplomacy":0,"disable_device":0,"disguise":0,"escape_artist":0,"fly":0,"handle_animal":0,"heal":0,"intimidate":0,"knowledge_arcana":0,"knowledge_dungeoneering":0,"knowledge_engineering":0,"knowledge_geography":0,"knowledge_history":0,"knowledge_local":0,"knowledge_nature":0,"knowledge_nobility":0,"knowledge_planes":0,"knowledge_religion":0,"linguistics":0,"perception":0,"perform":0,"profession":0,"ride":0,"sense_motive":0,"sleight_of_hand":0,"spellcraft":0,"stealth":0,"survival":0,"swim":0,"use_magic_device":0};
			var classkills = [];
			if (data["l1-class"] && data["l1-class"].data.class && data["l1-class"].data.class["data-Class skills"]) {
				_.each(data["l1-class"].data.class["data-Class skills"].split(","), (skl) => {
					classkills.push(skl.trim().toLowerCase().replace(/[^a-z\s]/gi, "").replace(/\s/gi,"_"));
				});
			}
				// Subclass1
			if (data["l1-class"] && data["l1-class"].values["class_subclass1"]) {
				if (data["l1-class"] && data["l1-class"].data["class_subclass1"] && data["l1-class"].data["class_subclass1"]["data-Class skills"]) {
					if (data["l1-class"].values["class_subclass1_classkills_choice"]) {
						if (classkills.indexOf(data["l1-class"].values["class_subclass1_classkills_choice"]) == -1) {
							classkills.push(data["l1-class"].values["class_subclass1_classkills_choice"]);
						}
					} else {
						_.each(data["l1-class"].data["class_subclass1"]["data-Class skills"].split(","), (skl) => {
							var skill = skl.trim().toLowerCase().replace(/[^a-z\s]/gi, "").replace(/\s/gi,"_");
							if (classkills.indexOf(skill) == -1) {
								classkills.push(skill);
							}
						});
					}
				}
			}
				// Subclass2
			if (data["l1-class"] && data["l1-class"].values["class_subclass2"]) {
				if (data["l1-class"] && data["l1-class"].data["class_subclass2"] && data["l1-class"].data["class_subclass2"]["data-Class skills"]) {
					if (data["l1-class"].values["class_subclass2_classkills_choice"]) {
						if (classkills.indexOf(data["l1-class"].values["class_subclass2_classkills_choice"]) == -1) {
							classkills.push(data["l1-class"].values["class_subclass2_classkills_choice"]);
						}
					} else {
						_.each(data["l1-class"].data["class_subclass2"]["data-Class skills"].split(","), (skl) => {
							var skill = skl.trim().toLowerCase().replace(/[^a-z\s]/gi, "").replace(/\s/gi,"_");
							if (classkills.indexOf(skill) == -1) {
								classkills.push(skill);
							}
						});
					}
				}
			}
			// console.log("*** DEBUG recalc classkills: " + classkills);
				// Processing
			_.each(classkills, (skill) => {
				if ((skillclass[skill] == 0) && (ranks[skill] == 1)) {
					skillclass[skill] = 3;
				}
				update[skill + "_class"] = "✔";
			});
			// === Abilities modifiers
			var skillablt = {"acrobatics":"dexterity","appraise":"intelligence","bluff":"charisma","climb":"strength","craft":"intelligence","diplomacy":"charisma","disable_device":"dexterity","disguise":"charisma","escape_artist":"dexterity","fly":"dexterity","handle_animal":"charisma","heal":"wisdom","intimidate":"charisma","knowledge_arcana":"intelligence","knowledge_dungeoneering":"intelligence","knowledge_engineering":"intelligence","knowledge_geography":"intelligence","knowledge_history":"intelligence","knowledge_local":"intelligence","knowledge_nature":"intelligence","knowledge_nobility":"intelligence","knowledge_planes":"intelligence","knowledge_religion":"intelligence","linguistics":"intelligence","perception":"wisdom","perform":"charisma","profession":"wisdom","ride":"dexterity","sense_motive":"wisdom","sleight_of_hand":"dexterity","spellcraft":"intelligence","stealth":"dexterity","survival":"wisdom","swim":"strength","use_magic_device":"charisma"};
			_.each(Object.keys(ability_mods), (mod) => {
				update["mod_" + mod] = (parseInt(ability_mods[mod]) || 0) < 0 ? ability_mods[mod] : "+" + ability_mods[mod];
			});
			// === Skill bonuses
			var skillbonus = {"acrobatics":0,"appraise":0,"bluff":0,"climb":0,"craft":0,"diplomacy":0,"disable_device":0,"disguise":0,"escape_artist":0,"fly":0,"handle_animal":0,"heal":0,"intimidate":0,"knowledge_arcana":0,"knowledge_dungeoneering":0,"knowledge_engineering":0,"knowledge_geography":0,"knowledge_history":0,"knowledge_local":0,"knowledge_nature":0,"knowledge_nobility":0,"knowledge_planes":0,"knowledge_religion":0,"linguistics":0,"perception":0,"perform":0,"profession":0,"ride":0,"sense_motive":0,"sleight_of_hand":0,"spellcraft":0,"stealth":0,"survival":0,"swim":0,"use_magic_device":0};
			var bonusskill = "";
				// race data-Skills Bonus
			if (data["l1-race"] && data["l1-race"].data.race && data["l1-race"].data.race["data-Skills Bonus"]) {
				bonusskill += ((bonusskill.length) ? "," : "") + data["l1-race"].data.race["data-Skills Bonus"];
			}
				// race data-Skills Bonus Choice
			if (data["l1-race"] && data["l1-race"].values.race_skill_bonus_choice) {
				bonusskill += ((bonusskill.length) ? "," : "") + data["l1-race"].values.race_skill_bonus_choice;
			}
				// class data-Skills bonus
			if (data["l1-class"] && data["l1-class"].data.class && data["l1-class"].data.class["data-Skills bonus"]) {
				bonusskill += ((bonusskill.length) ? "," : "") + data["l1-class"].data.class["data-Skills bonus"];
			}
				// Subclass1 data-Skills bonus
			if (data["l1-class"] && data["l1-class"].values["class_subclass1"]) {
				if (data["l1-class"] && data["l1-class"].data["class_subclass1"] && data["l1-class"].data["class_subclass1"]["data-Skills bonus"]) {
					bonusskill += ((bonusskill.length) ? "," : "") + data["l1-class"].data["class_subclass1"]["data-Skills bonus"];
				}
			}
				// Subclass1 data-Skills bonus
			if (data["l1-class"] && data["l1-class"].values["class_subclass2"]) {
				if (data["l1-class"] && data["l1-class"].data["class_subclass2"] && data["l1-class"].data["class_subclass2"]["data-Skills bonus"]) {
					bonusskill += ((bonusskill.length) ? "," : "") + data["l1-class"].data["class_subclass2"]["data-Skills bonus"];
				}
			}
				// Calculation
			_.each(bonusskill.split(","), (skl) => {
				if (skl.indexOf("+") != -1) {
					var skill = skl.split("+")[0].trim().toLowerCase().replace(/[^a-z\s]/gi, "").trim().replace(/\s/gi,"_");
					skillbonus[skill] = (parseInt(skillbonus[skill]) || 0)
										+ (parseInt(skl.split("+")[1].replace(/[^\d\-]/gi, "")) || 0);
				}
			});
			_.each(Object.keys(skillbonus), (skill) => {
				update[skill + "_bonus"] = ((parseInt(skillbonus[skill]) || 0) > 0 ? "+" : "")
										+ ((parseInt(skillbonus[skill]) || 0) == 0 ? "" : skillbonus[skill]);
			});
			// Totals
			_.each(Object.keys(skillablt), (skill) => {
				update[skill + "_total"] = (parseInt(skillclass[skill]) || 0)
										+ (parseInt(ranks[skill]) || 0)
										+ (parseInt(ability_mods[skillablt[skill]]) || 0)
										+ (parseInt(skillbonus[skill]) || 0);
			});
		}

		setCharmancerText(update);
		return returnObj;
	};

</script>
