#ifndef USER_CONFIG_H
#define USER_CONFIG_H

#define EPD_SPI_NUM        SPI2_HOST
#define ESP32_I2C_DEV_NUM  I2C_NUM_0

// As duas ESPs usam este canal fixo, sem exigir internet no transmissor.
#define ESPNOW_CHANNEL 1

#define EPD_WIDTH  200
#define EPD_HEIGHT 200
#define LVGL_SPIRAM_BUFF_LEN (EPD_WIDTH * EPD_HEIGHT * 2)

// Pinos SPI usados pela tela e-paper.
#define EPD_DC_PIN    GPIO_NUM_10
#define EPD_CS_PIN    GPIO_NUM_11
#define EPD_SCK_PIN   GPIO_NUM_12
#define EPD_MOSI_PIN  GPIO_NUM_13
#define EPD_RST_PIN   GPIO_NUM_9
#define EPD_BUSY_PIN  GPIO_NUM_8


// Pinos que ligam a alimentação dos circuitos da placa.
#define EPD_PWR_PIN     GPIO_NUM_6
#define Audio_PWR_PIN   GPIO_NUM_42
#define VBAT_PWR_PIN    GPIO_NUM_17

#define BOOT_BUTTON_PIN GPIO_NUM_0
#define PWR_BUTTON_PIN  GPIO_NUM_18

// Pino reservado para despertar do modo de baixo consumo.
#define ext_wakeup_pin_1 GPIO_NUM_0

// Barramento I2C usado pelo RTC PCF85063.
#define ESP32_I2C_SDA_PIN GPIO_NUM_47
#define ESP32_I2C_SCL_PIN GPIO_NUM_48

// Sem animações, o LVGL pode descansar por um segundo entre verificações.
// Uma mudança de texto ainda acorda a tarefa imediatamente.
#define EXAMPLE_LVGL_TICK_PERIOD_MS    1000
#define EXAMPLE_LVGL_TASK_MAX_DELAY_MS 1000
#define EXAMPLE_LVGL_TASK_MIN_DELAY_MS 1000

// Endereços dos dispositivos presentes no barramento I2C.
#define I2C_RTC_DEV_Address        0x51
#define I2C_SHTC3_DEV_Address      0x70           

#endif
