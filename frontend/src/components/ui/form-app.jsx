import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { cn } from "@/lib/utils"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"


export const AppInput = ({ form, name, label, ...props }) => {
    return <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                    {!props.icon
                        ? <Input {...props} {...field} />
                        : <div className='relative'>
                            <props.icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className={cn("pl-10", props?.className)}  {...props} {...field} />
                        </div>
                    }

                </FormControl>
                <FormMessage />
            </FormItem>
        )}
    />
}

export const AppSelect = ({ form, name, label, children, desc, ...props }) => {
    return <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}  >
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue {...props} />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[180px]">
                        {children}
                    </SelectContent>
                </Select>
                {desc && <FormDescription>{desc}</FormDescription>}
                <FormMessage />
            </FormItem>
        )}
    />
}

export const AppTextarea = ({ form, name, label, ...props }) => {
    return <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                    <Textarea
                        placeholder=""
                        className="resize-none"
                        {...props}
                        {...field}
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
        )}
    />
}
