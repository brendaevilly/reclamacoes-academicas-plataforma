/**
 * TB4: Sistema reutilizável de validação visual de formulários.
 *
 * Como usar:
 *
 *   const fv = FormValidator.attach("#meu-form", {
 *       fields: {
 *           email:  { required: true, email: true, label: "E-mail" },
 *           senha:  { required: true, minLength: 8, label: "Senha" },
 *           nome:   { required: true, minLength: 2, label: "Nome" }
 *       },
 *       onSubmit: async (data) => { ... }   // chamada só se tudo válido
 *   });
 *
 * Recursos:
 *   - Mensagens de erro em tempo real (blur, input, change)
 *   - Marcação visual de campos válidos/ inválidos
 *   - Regras: required, email, minLength, maxLength, pattern, match,
 *             strongPassword, custom (função sync ou async)
 *   - Resumo de erros opcional no topo do formulário
 *   - Bloqueio de submit enquanto inválido
 */

(function () {
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    /**
     * Garante que existe um <small class="fv-error-message"> abaixo do campo.
     */
    function ensureErrorEl(field) {
        let container = field.closest(".fv-field");
        if (!container) {
            // Envelopar o campo em um wrapper .fv-field para permitir o ::after
            container = document.createElement("div");
            container.className = "fv-field";
            field.parentNode.insertBefore(container, field);
            container.appendChild(field);
        }
        let err = container.querySelector(".fv-error-message");
        if (!err) {
            err = document.createElement("small");
            err.className = "fv-error-message";
            err.setAttribute("aria-live", "polite");
            container.appendChild(err);
        }
        return { container, errorEl: err };
    }

    function setFieldState(field, message) {
        const { container, errorEl } = ensureErrorEl(field);
        if (message) {
            container.classList.add("is-invalid");
            container.classList.remove("is-valid");
            field.classList.add("is-invalid");
            field.classList.remove("is-valid");
            errorEl.textContent = message;
            field.setAttribute("aria-invalid", "true");
        } else {
            container.classList.remove("is-invalid");
            field.classList.remove("is-invalid");
            if (field.value && field.value.toString().trim().length > 0) {
                container.classList.add("is-valid");
                field.classList.add("is-valid");
            } else {
                container.classList.remove("is-valid");
                field.classList.remove("is-valid");
            }
            errorEl.textContent = "";
            field.removeAttribute("aria-invalid");
        }
    }

    function validateValue(rules, value, allValues, label) {
        const v = (value == null ? "" : String(value)).trim();

        if (rules.required && !v) {
            return `${label || "Este campo"} é obrigatório.`;
        }

        if (!v) return null; // demais regras só fazem sentido com valor

        if (rules.email && !EMAIL_RE.test(v)) {
            return "Informe um e-mail válido.";
        }

        if (rules.minLength && v.length < rules.minLength) {
            return `Deve ter ao menos ${rules.minLength} caracteres.`;
        }

        if (rules.maxLength && v.length > rules.maxLength) {
            return `Deve ter no máximo ${rules.maxLength} caracteres.`;
        }

        if (rules.pattern && !rules.pattern.test(v)) {
            return rules.patternMessage || "Formato inválido.";
        }

        if (rules.match) {
            const other = allValues[rules.match];
            if (other !== v) {
                return rules.matchMessage || "Os campos não coincidem.";
            }
        }

        if (rules.strongPassword) {
            const errors = [];
            if (v.length < 8) errors.push("ao menos 8 caracteres");
            if (!/[A-Z]/.test(v)) errors.push("uma letra maiúscula");
            if (!/[a-z]/.test(v)) errors.push("uma letra minúscula");
            if (!/[0-9]/.test(v)) errors.push("um número");
            if (!/[\W_]/.test(v)) errors.push("um caractere especial");
            if (errors.length > 0) {
                return "A senha precisa ter " + errors.join(", ") + ".";
            }
        }

        if (typeof rules.custom === "function") {
            const msg = rules.custom(v, allValues);
            if (msg) return msg;
        }

        return null;
    }

    function getFormValues(formEl, fields) {
        const values = {};
        for (const name of Object.keys(fields)) {
            const el = formEl.querySelector(`[name="${name}"], #${name}`);
            if (!el) continue;
            if (el.type === "checkbox") {
                values[name] = el.checked;
            } else {
                values[name] = el.value;
            }
        }
        return values;
    }

    function getFieldElements(formEl, fields) {
        const map = {};
        for (const name of Object.keys(fields)) {
            const el = formEl.querySelector(`[name="${name}"], #${name}`);
            if (el) map[name] = el;
        }
        return map;
    }

    /**
     * Hint visual de senha forte: lista de regras + barra de força.
     */
    function attachPasswordHint(field) {
        let container = field.closest(".fv-field");
        if (!container) {
            container = document.createElement("div");
            container.className = "fv-field";
            field.parentNode.insertBefore(container, field);
            container.appendChild(field);
        }
        if (container.querySelector(".fv-password-hint")) return;

        const hint = document.createElement("ul");
        hint.className = "fv-password-hint";
        hint.innerHTML = `
            <li data-rule="length">Pelo menos 8 caracteres</li>
            <li data-rule="upper">Uma letra maiúscula (A-Z)</li>
            <li data-rule="lower">Uma letra minúscula (a-z)</li>
            <li data-rule="digit">Um número (0-9)</li>
            <li data-rule="special">Um caractere especial (!@#...)</li>
        `;

        const bar = document.createElement("div");
        bar.className = "fv-strength-bar";
        bar.dataset.level = "0";
        bar.innerHTML = "<span></span>";

        container.appendChild(hint);
        container.appendChild(bar);

        const update = () => {
            const v = field.value;
            const checks = {
                length: v.length >= 8,
                upper: /[A-Z]/.test(v),
                lower: /[a-z]/.test(v),
                digit: /[0-9]/.test(v),
                special: /[\W_]/.test(v)
            };
            let score = 0;
            for (const k of Object.keys(checks)) {
                const li = hint.querySelector(`[data-rule="${k}"]`);
                if (!li) continue;
                if (checks[k]) {
                    li.classList.add("ok");
                    score++;
                } else {
                    li.classList.remove("ok");
                }
            }
            // 0-1 = fraco; 2 = razoável; 3 = bom; 4-5 = forte
            const level = score === 0 ? 0 : score <= 1 ? 1 : score === 2 ? 2 : score === 3 ? 3 : 4;
            bar.dataset.level = String(level);
        };

        field.addEventListener("input", update);
        update();
    }

    const FormValidator = {
        attach(formSelector, config) {
            const formEl = typeof formSelector === "string"
                ? document.querySelector(formSelector)
                : formSelector;
            if (!formEl) {
                console.warn("[FormValidator] Form não encontrado:", formSelector);
                return null;
            }

            const fields = config.fields || {};
            const fieldEls = getFieldElements(formEl, fields);

            // Desativar validação nativa para usarmos a nossa
            formEl.setAttribute("novalidate", "novalidate");

            // Resumo de erros (opcional, criado se não existir)
            let summary = formEl.querySelector(".fv-summary");
            if (config.summary !== false && !summary) {
                summary = document.createElement("div");
                summary.className = "fv-summary";
                summary.setAttribute("role", "alert");
                summary.innerHTML = "<strong>Corrija os campos abaixo:</strong><ul></ul>";
                formEl.prepend(summary);
            }

            // Hints visuais de senha
            for (const name of Object.keys(fields)) {
                if (fields[name].strongPassword && fieldEls[name]) {
                    attachPasswordHint(fieldEls[name]);
                }
            }

            // Validação por campo
            function validateField(name) {
                const el = fieldEls[name];
                if (!el) return null;
                const allValues = getFormValues(formEl, fields);
                const value = allValues[name];
                const msg = validateValue(fields[name], value, allValues, fields[name].label);
                setFieldState(el, msg);
                return msg;
            }

            function validateAll() {
                const errors = {};
                for (const name of Object.keys(fields)) {
                    const msg = validateField(name);
                    if (msg) errors[name] = msg;
                }
                return errors;
            }

            // Validação em tempo real
            for (const [name, el] of Object.entries(fieldEls)) {
                const handler = () => validateField(name);
                el.addEventListener("blur", handler);
                el.addEventListener("input", () => {
                    // Só revalida campos já marcados como inválidos para evitar
                    // poluir o usuário antes mesmo de ele ter terminado.
                    if (el.classList.contains("is-invalid") || el.value.length > 0) {
                        handler();
                    }
                });
                if (el.tagName === "SELECT") el.addEventListener("change", handler);

                // Se houver "match", revalidar o campo dependente quando o original mudar
                for (const [otherName, otherCfg] of Object.entries(fields)) {
                    if (otherCfg.match === name) {
                        el.addEventListener("input", () => validateField(otherName));
                    }
                }
            }

            // Submit interceptado
            formEl.addEventListener("submit", async (e) => {
                e.preventDefault();
                const errors = validateAll();
                const errorList = Object.values(errors);

                if (errorList.length > 0) {
                    if (summary) {
                        const ul = summary.querySelector("ul");
                        ul.innerHTML = "";
                        for (const msg of errorList) {
                            const li = document.createElement("li");
                            li.textContent = msg;
                            ul.appendChild(li);
                        }
                        summary.classList.add("visible");
                    }
                    // Focar no primeiro campo inválido
                    const firstInvalid = formEl.querySelector(".is-invalid");
                    if (firstInvalid && firstInvalid.focus) firstInvalid.focus();
                    return;
                }

                if (summary) {
                    summary.classList.remove("visible");
                    summary.querySelector("ul").innerHTML = "";
                }

                if (typeof config.onSubmit === "function") {
                    const values = getFormValues(formEl, fields);
                    try {
                        await config.onSubmit(values, formEl);
                    } catch (err) {
                        console.error("[FormValidator] onSubmit lançou erro:", err);
                    }
                }
            });

            return {
                validateAll,
                validateField,
                getValues: () => getFormValues(formEl, fields),
                setServerError(name, message) {
                    const el = fieldEls[name];
                    if (el) setFieldState(el, message);
                }
            };
        }
    };

    window.FormValidator = FormValidator;
})();
