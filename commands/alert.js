class AlertCommand extends Command {
    static _ = ActionHandler.derived.add(this);
    
    constructor() {
        super();
        this.id = 6;
    }

    execute(data) {
        if (data.force?.template && data.force.template != "0") {
            let template_data = data.force.template.split("_")
            let type = template_data[0]
            let index = parseInt(template_data[1])
            this.execute_alert(data, type, index)
        } else if (data.force?.type && data.force?.message) {
            switch (data.force.type) {
                case "alert":
                    alert(data.force.message);
                    break;
                case "confirm":
                    confirm(data.force.message);
                    break;
                case "prompt":
                    prompt(data.force.message);
                    break;
                default:
                    break;
            }
        } else {
            this.execute_alert(data, this.random_index(3))
        }
    }

    execute_alert(data, alert_type, template_index=null) {
        switch (alert_type) {
            case 0: case "alert":
                alert(this.get_template(template_index, data.alert))
                break;
            case 1: case "confirm":
                confirm(this.get_template(template_index, data.confirm));
                break;
            case 2: case "prompt":
                let prompt_action = this.get_template(template_index, data.prompt)
                let input = prompt(prompt_action.message)
    
                if (prompt_action.otherwise) {
                    if (input == prompt_action.value) break;
                    if (prompt_action.otherwise.probability && Math.random() > prompt_action.otherwise.probability) break;
    
                    switch (prompt_action.otherwise.action) {
                        case "redirect":
                            location.href = prompt_action.otherwise.to;
                            break;
    
                        case "replace_body":
                            document.body.innerHTML = prompt_action.otherwise.with;
                            break;
    
                        default:
                            break;
                    }
                }
                break;
            default:
                break;
        }
    }

    get_template(template_index, template_array) {
        if (template_index != null) return template_array[template_index]
        return template_array[this.random_index(template_array.length)]
    }
}