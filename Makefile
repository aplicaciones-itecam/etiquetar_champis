backend = etiquetador
bbdd = db
frontend = frontend
null = /dev/null
contenedor_backend = api_etiquetador
contenedor_bbdd = etiquetar-postgres_container
contenedor_frontend = etiquetar-etiquetador_frontend
fallo_cobertura = 80
rama_principal = main
modelo_concurrencia = greenlet
run:
	@docker compose down 2> $(null) > $(null) &
	make limpiar
	docker compose up -d 2> $(null) > $(null)
	@echo "Contenedores operativos:"
	@docker compose ls

api_local:
	cd $(backend) && uv run uvicorn main:app --host 0.0.0.0 --port 8000


run_visual:
	@docker compose down 2> $(null) > $(null)
	@docker compose up 
back:
	docker compose rm -svf $(backend)
	docker rmi $(contenedor_backend) 
	make run

front:
	docker compose rm -svf $(frontend)
	docker rmi $(contenedor_frontend) 
	make run
back_visual:
	docker compose rm -svf $(backend)
	docker rmi $(contenedor_backend) 
	make run_visual

restart:
	@echo "Reiniciando contenedores"
	docker compose down -v --rmi all 2> $(null) > $(null)
	make run

restart_visual:
	@echo "Reiniciando contenedores"
	docker compose down -v --rmi all 2> $(null) > $(null)
	make run_visual
test_back:
	coverage run --concurrency $(modelo_concurrencia) -m pytest --alluredir=allure-result-pytest --cov=$(backend) --cov-fail-under=$(fallo_cobertura) --cov-report=html 
	allure generate allure-result-pytest -o pytest-report --lang es

test_bbd:
	make restart 
	@echo "contenedores operativos"
	behave

test_bbd_reporte:
	make restart
	behave -f allure_behave.formatter:AllureFormatter -o allure-result-behave
	allure generate allure-result-behave -o behave-report  --lang es
full_test:
	make test_back
	make test_bbd_reporte
limpiar:
	/usr/bin/find  -type "d" -iname "__pycache__" | while read -r line; do rm -rfv $$line; done
	/usr/bin/find   -type "d" -iname "htmlcov" | while read -r line; do rm -rfv $$line; done
	/usr/bin/find   -type "d" -iname "allure-result-*" | while read -r line; do rm -rfv $$line; done
	/usr/bin/find   -type "d" -iname "*-report" | while read -r line; do rm -rfv $$line; done
	/usr/bin/find   -type "d" -iname ".pytest_cache" | while read -r line; do rm -rfv $$line; done
	/usr/bin/find   -type "d" -iname ".lprof" | while read -r line; do rm -rfv $$line; done
	/usr/bin/find   -type "f" -iname ".coverage" | while read -r line; do rm -rfv $$line; done
	/usr/bin/find   -type "f" -iname ".coveragerc" | while read -r line; do rm -rfv $$line; done
	/usr/bin/find   -type "f" -iname "test_output.log" | while read -r line; do rm -rfv $$line; done
	/usr/bin/find   -type "f" -iname "report.xml" | while read -r line; do rm -rfv $$line; done
	/usr/bin/find   -type "f" -iname "test_reports.xml" | while read -r line; do rm -rfv $$line; done

borrar_ramas_local:
	git checkout $(rama_principal)
	git branch | grep "*" -v | sed "s/ //g" | while read rama; do git branch -d $$rama; done

borrar_ramas_remoto:
	git checkout $(rama_principal)
	git branch | grep "*" -v | sed "s/ //g" | while read rama; do git push origin --delete $$rama; done

test_gen:
	playwright codegen http://localhost:3001



migrar_f1:
	@echo "fase 1 de la migracion"
	make run
	cd sql && ./backup.bat && mv backup.sql old.sql && cd ..
	make back
	pip install -r migracion/requirements.txt
	@echo "Me voy a dormir un rato ..."
	sleep 60
	python3 migracion/migrate.py
	cd sql && ./migrar.bat; cd ..
	@docker compose down -v --rmi all
	@echo Se eliminan los contenedores, si quieres revisar los cambios omitelo o vuelve a levantarlos antes de continuar.
	@echo "Continua con el siguiente paso del README"



migrar_f2:
	@echo "fase 2 de la migracion"
	make restart;
	cd sql && ./restaurar.bat; cd ..
	@echo "Comprueba que el estado se ha mantenido correctamente"
	
	
